# WO-V1 — The reading vault (Kernel → Obsidian projection)

status: open, cuttable — pre-build read run 2026-07-26 (`grok-4.5-high`), **eleven findings, six
High, all fixed in this text**; record appended at the bottom
assignee: builder
depends: WO-104 (generated readers) — done, merged. **Not blocked by anything on the ladder.**
ladder: **off-ladder.** This is not one of the eleven doctrine rungs (`SCOPES.md`) and must never
be counted as one. It is founder-facing value that can land whenever it is worth having.

## Objective

Everything the Kernel records becomes readable in Obsidian — one way, hash-verified, and incapable
of corrupting the ledger.

## In plain terms

Right now the only way to see what your system recorded is to query a database or ask an agent. This
builds a vault at `~/Vaults/QuantFlow Ontology` that fills itself from the Kernel: every artifact,
session and run as a note, with the ontology's own links becoming Obsidian backlinks so the graph
view shows your actual research lineage.

**It is a projection, not a second copy of truth.** The Kernel writes to it; it never writes back. If
you delete the whole vault, nothing is lost — it regenerates.

**If it goes wrong:** either the vault becomes a second truth store that drifts from the Kernel, or
it renders content that no longer matches the artifact claiming it (the file on disk was edited after
publication), or it overwrites the founder's own notes.

## RULING — one direction, and hash-verified (architect, final)

**Ruled: the projection reads the Kernel and writes files. It never reads the vault, and nothing in
the vault is ever an input to anything.**

This is the One Rule applied literally: the Kernel owns truth, everything else is a projection or a
cache. A vault that fed anything back would be a second truth store — the failure this repo exists
to prevent — so there is no "sync", no "import", and no conflict resolution. Re-running the
projection is always safe and always produces the same result.

**Ruled: every object type is projected, one folder per type.** The pre-build read found the first
draft demanded both "iterate `schema.objects`" (23 types) and "only `Artifacts/`, `Sessions/`,
`Runs/`" (3 folders) — incompatible. Resolved in favour of the schema: **a folder per object type,
named for the type, created as needed.** `Artifacts/`, `Sessions/` and `Runs/` already exist because
they are the three with data today; the other twenty appear when they have rows. This is what makes
G5 meaningful — a new object type must produce notes with no projector edit.

**Ruled: content is rendered only when its hash verifies.** Measured, and this is the crux:

```
artifact columns: id, created_at, kind, content_hash, storage_ref
sample storage_ref: /home/sidnig21/.collaborator/agent-artifacts/<uuid>.md
```

**The Kernel stores a pointer, not the bytes.** `content_hash` is the artifact's identity, but the
content lives at a filesystem path that can be moved, deleted, or **edited after publication.** So
before rendering any artifact body the projection recomputes the hash of the bytes at `storage_ref`
and compares it to `content_hash`:

- **match** → render the content.
- **mismatch** → render the note **without** the body, stating plainly that the file on disk no
  longer matches the published artifact, and showing both hashes.
- **missing** → render the note without the body, stating the file is gone.

**Never render unverified bytes as though they were the artifact.** A vault that silently shows an
edited file as the published artifact is worse than no vault: it launders a tampered file into
something that looks authoritative.

**Ruled: the projector owns a set of folders and regenerates them from empty on every run.**

Added at the pre-build read, which found two contradictions the first draft could not resolve: what
happens to notes for objects deleted from the Kernel, and whether "never reads the vault" permits
reading filenames or mtimes. Both dissolve under one rule:

> On each run the projector **deletes the entire contents of the folders it owns, then writes them
> fresh from the Kernel.** It never reads vault state — not content, not filenames, not mtimes, not
> directory listings. Its only vault operations are *remove my folders' contents* and *write files*.

Orphans cannot accumulate, because nothing survives a run that the Kernel did not just produce. And
"delete the vault and it regenerates" becomes literally true rather than aspirational.

**It owns exactly one folder per projected object type, and nothing else.** `_Doctrine/`,
`README.md`, `.obsidian/`, and every other path in the vault are **never written, never deleted, and
never read**. A projector that touches the vault root, the README, or `.obsidian/` is defective.

## Context — measured facts (verify before use)

| Claim | Where | Verified |
|---|---|---|
| Vault exists with the four folders and a README | `~/Vaults/QuantFlow Ontology` | ✅ created 2026-07-26 |
| Artifact stores a pointer, not bytes | `artifact` columns above | ✅ |
| Real Kernel today: 5 `artifact`, 18 `agent_session`, **2 `agent_definition`**, 0 `run`, **0 `links`**, 68 `events` | `~/.collaborator/dev/worktree-<id>/kernel.db` | ✅ — *an earlier draft said "2 species"; there is no `species` table, that is domain slang for `agent_definition`. Corrected at the read.* |
| Generated readers exist and are schema-driven | `packages/qf-kernel/src/read.ts` — `getObject:64`, `queryObjects:**84**`, `getLinks:**126**` | ✅ — *the first draft cited 81 and 111; both wrong, corrected at the read* |
| `queryObjects` supports unbounded reads and ordering | WO-106 D2 — `order`, `limit: null` | ✅ |
| `contentHash` helper exists | `packages/qf-kernel/src/hash.ts` — `contentHash(bytes: Uint8Array): string`, SHA-256 hex, re-exported from the package index | ✅ |
| **`openKernel` creates a database if the path is missing** | `db-bun.ts:9` — docstring *"Open (or create)"*; supports `{ readonly: true }` | ✅ — this is why D1 must verify existence first and open read-only |
| **`kernel-sole-writer` (Law E) allowlist has no entry for a new `tools/` package** | `qa/gates/kernel-sole-writer.ts:36-53` | ✅ — importing `qf-kernel` is fine (precedent: `tools/qf-read-tools/src/server.ts:12`); opening `bun:sqlite` directly in `tools/` is not |
| **Artifact `id` equals `content_hash` on live rows** | measured on the founder's Kernel | ✅ — so comparing `id` to `content_hash` is a tautology; G2 forbids it explicitly |
| 19 gates today | `bun qa/run.ts --list` | ✅ |
| Artifact kinds | `strategy_spec`, `code`, `result_set`, `report`, `trajectory` | ✅ |

**Honest note on the graph payoff:** `links` is **0** in the real Kernel today. Backlinks will be
sparse until WO-107b writes them. Build the link rendering anyway — it is a few lines given
`getLinks` — but do not sell the graph as this order's headline, and do not gate on link count.

## Deliverables

**D1 — the projector, and how it opens the Kernel.** A script at `tools/qf-vault-projection/`.

**Opening the Kernel — spelled out, because the first draft's "readers only" literally excluded the
one call that obtains a handle.** Import from the `qf-kernel` package and use
**`openKernel(path, { readonly: true })`**, following the precedent at
`tools/qf-read-tools/src/server.ts:12`. Then read **only** through `getObject`, `queryObjects` and
`getLinks`. **Never open `bun:sqlite` directly** — `tools/qf-vault-projection/` is not on the
`kernel-sole-writer` allowlist (`qa/gates/kernel-sole-writer.ts:36-53`) and doing so reddens that
gate. No hand-written SQL anywhere; that is the second-implementation problem WO-106 spent a rung
deleting.

**The database path is `QF_KERNEL_DB`**, matching every other tool. **The projector must confirm the
file exists before opening it** — measured, `openKernel` is documented "Open (**or create**)" and
will happily write a brand-new empty Kernel at a mistyped path (`db-bun.ts:9`). Creating a database
is the opposite of what a read-only projection should ever do.

**The vault path is `QF_VAULT_ROOT`.** The projector **exits non-zero without writing anything** if
that path does not exist, is not a directory, or does not contain a `README.md` at its root. Both env
vars unset, empty, or whitespace-only count as absent and are the same refusal. Refusal is
`process.exit(1)` with a message naming which variable was wrong — automation must be able to tell
refusal from success.

**D2 — one note per object, generated from the schema, one folder per type.** Iterate
`schema.objects` — never a hand-written list of types — so a new object type gets notes with no new
code, the property WO-104 proved for read tools. Each type writes into a folder named for that type;
the folder is created if absent and its contents cleared at the start of each run (see the ruling).

**Read every row: `queryObjects(db, type, undefined, null)`.** The `null` limit is mandatory and is
called out because the default is **100** — measured, today's Kernel has 18 sessions, so a projector
that omits `null` is byte-identical on every run and every gate stays green **while silently
truncating the moment a table passes 100 rows.** That is not a bug a later run would reveal; it is
one that hides until the data matters.

Frontmatter carries the object's fields. **Filenames are `<id>.md`** — ids are already unique and
stable, and for artifacts `id` equals `content_hash`. Do not derive names from a `name` field (only
some types have one) or slugify anything.

**D3 — artifact bodies, hash-verified. The comparison contract is exact.**

Read the bytes at `storage_ref` into a `Uint8Array`, pass them to **`contentHash` from
`packages/qf-kernel/src/hash.ts`**, and compare the result to the **`content_hash` column of that
artifact's Kernel row**. Nothing else counts as the check:

- **Not** comparing `id` to `content_hash` — measured, they are **equal** on live rows, so that is a
  tautology that never reads the file.
- **Not** hashing the `storage_ref` string, the note frontmatter, or any buffer other than the file's
  actual bytes.
- **Not** comparing a hash to another hash of the same buffer.

`report` and `strategy_spec` inline their content as markdown when the hash matches; `code`,
`result_set` and `trajectory` link to `storage_ref` rather than inlining. Mismatch and missing states
are rendered as stated in the ruling, never silently omitted.

**D4 — links become wikilinks.** Every row in `links` touching an object becomes a `[[…]]` in that
object's note, labelled with its `kind` (`produces`, `tests`, `evaluated_by`, `gates`, …), so
Obsidian's backlinks and graph reflect the ontology's real edges.

**D5 — idempotence.** Running the projector twice produces **byte-identical** output. Same discipline
as `golden/`: no timestamps-of-run, no nondeterministic ordering, no random ids in generated files.

## Acceptance gates

Every gate ships with a bait transcript: break it, show red, restore, show green.

**G1 — one direction, provable.** The projector performs **no read of vault state at all** — not
content, not filenames, not mtimes, not directory listings. Its only vault operations are clearing
its own folders and writing files.
*Baits:* (a) plant a file in a projected folder containing a fabricated object id, run the projector,
and confirm the Kernel is byte-identical afterwards **and** the plant is gone (cleared, not merged);
(b) plant a file in `_Doctrine/` and confirm it survives untouched; (c) a static check that the
projector calls no directory-listing or stat API against the vault — **`readdir`, `stat`, `exists`
and friends are as forbidden as `readFile`**, because a projector that branches on what it finds is
treating the vault as an input even without reading bytes.

**G2 — the hash gate, with a positive case that kills fail-closed.** Three assertions, and the first
is the one the pre-build read added:

1. **An untouched artifact renders WITH its body.** Publish, project, confirm the content is inlined.
2. Edit the file at `storage_ref`, project again → the note renders **without** the body and states
   the mismatch, showing both hashes.
3. Delete the file, project again → missing state, no body.

**Assertion 1 exists because without it the gate is satisfiable by a projector that never reads
`storage_ref` at all and always reports mismatch.** That implementation passes an
edit-and-delete-only gate perfectly while verifying nothing. It must fail here.
*Baits:* (a) the edit → mismatch; (b) the delete → missing; (c) **remove the hash comparison** → the
edited content renders as genuine, proving the comparison is what stops it; (d) **replace the
comparison with `id === content_hash`** → assertion 2 must still go red, proving the check reads the
file rather than comparing two columns that are already equal.

**G3 — the projector's write scope is exactly its own folders.** `_Doctrine/`, the vault `README.md`,
and `.obsidian/` are byte-identical after two runs.
*Baits:* (a) widen the write scope to the vault root → red; (b) have the projector rewrite
`README.md` → red. The gate asserts *only my folders*, not merely *not `_Doctrine/`*.

**G4 — idempotence and completeness under load.** Run twice on an unchanged Kernel; the second run
produces **no diff**. Then, against a fixture Kernel with **more than 100 rows of one type and
several sharing an identical `created_at`**, confirm every row still produces a note and both runs
remain identical.
*Baits:* (a) introduce a run-timestamp into any generated file → red; (b) **drop the `limit: null`**
→ red on the >100 fixture, proving the gate sees truncation rather than only nondeterminism;
(c) reorder tied `created_at` rows → output must be unchanged, proving a stable tiebreak.

**G5 — schema-driven, not hand-listed.** Point the projector at a fixture schema carrying an extra
object type and confirm a folder named for that type appears, populated, **with no projector edit**.
*Bait:* hand-list the types → the fixture type produces no folder → red.

**G6 — full cold suite.** `bun qa/run.ts --all` in a worktree with zero `node_modules`, unpiped, `$?`
on its own line, no other agent on the machine. The projector's gate registers as `vault-projection`
and **must itself run G1–G5's assertions** — a gate that registers under that name and asserts a
constant is decoration, and the order names this because the read found it satisfiable.
`kernel-sole-writer` must stay green, which it will only if the projector imports `qf-kernel` rather
than opening `bun:sqlite`.

## Report-back format

Per `PROTOCOL.md`. Full unedited gate output, every bait in break → red → restore → green form, and a
screenshot or file listing of the vault after a real projection against the founder's Kernel (5
artifacts, 18 sessions today).

## Out of scope

Writing anything back to the Kernel from the vault — ever, in any form, under any justification.
Obsidian plugins. Sync. Editing the founder's `_Doctrine/`. Publishing artifacts (that is WO-106b's
staging root, a different folder with a different purpose). Real market data (P4).


---

# PRE-BUILD ADVERSARIAL READ — 2026-07-26, before any builder saw this file

**Reader:** Cursor `grok-4.5-high` (writer was the checking seat; reader ≠ writer).
**Result: eleven findings — six High — every one in the order text, every one fixed above.**
Full transcript: `docs/orders/evidence/wo-v1/prebuild-read.md`.

This was the roughest first draft of the three orders read today, and the reason is worth recording:
it was written quickly, on a founder request, about a surface (the filesystem and a third-party
vault) that no existing gate covers. **Novel surface, no incumbent gates, fastest draft — that
combination produced six High findings.**

## The six High, one line each

1. **G2 was satisfiable without ever reading a file.** A projector that never opens `storage_ref` and
   always reports "mismatch" passed every original bait, including the remove-the-check bait, while
   verifying nothing. Fixed by adding a **positive assertion** — an untouched artifact must render
   *with* its body — plus a bait that swaps in `id === content_hash`, which is a tautology on live
   rows (measured: `id` and `content_hash` are **equal** for artifacts).
2. **"Generated readers only" literally excluded `openKernel`**, the one call that obtains a handle.
   A literal builder would have opened `bun:sqlite` directly in `tools/qf-vault-projection/` — which
   is **not on the `kernel-sole-writer` allowlist** (`qa/gates/kernel-sole-writer.ts:36-53`) and
   reddens Law E. The order also never named the database path, and never noticed that `openKernel`
   is documented *"Open (**or create**)"* and will write a new empty Kernel at a mistyped path.
   Now: `openKernel(path, { readonly: true })`, `QF_KERNEL_DB`, existence checked first.
3. **Two incompatible scopes.** The Objective and D2 said "every object type" (23); the ruling and
   folder layout said three. Resolved: **one folder per object type**, which is also what makes G5
   meaningful.
4. **Stale notes were unspecified**, and any orphan cleanup would have contradicted "never read the
   vault." Dissolved by ruling that the projector **clears its own folders and regenerates from
   empty** — no orphans possible, no vault reads needed, and "delete it and it regenerates" becomes
   literally true.
5. **`limit: null` was not mandated.** The default is 100; today's Kernel has 18 sessions, so a
   truncating projector is byte-identical on every run and **every gate stays green until a table
   passes 100 rows.** Now mandatory, with a >100-row fixture bait in G4.
6. **A measured-fact row was wrong** — "2 species". There is no `species` table; it is
   `agent_definition`. Domain slang leaked into a measurements table, which is exactly what those
   tables exist to prevent.

## Medium and Low, fixed

- **G1 permitted filenames and mtimes as inputs** under "existence checks" — a projector could branch
  on what it found and still pass. Now `readdir`/`stat`/`exists` against the vault are as forbidden
  as `readFile`.
- **G3 only protected `_Doctrine/`** — a projector could rewrite the vault `README.md` or
  `.obsidian/`. Now the assertion is *only my own folders*.
- **G4 could not see truncation or tied-timestamp reordering.** Both now baited.
- **G6 was satisfiable by registering a no-op gate** named `vault-projection`. The order now requires
  the gate to run G1–G5's assertions.
- **Two line citations were wrong** — `queryObjects` is at **84** (not 81), `getLinks` at **126**
  (not 111). Verified by the author before amending.
- Wikilink shape, exit semantics, and filename derivation were each open to competing readings; all
  now spelled.

Verified by the author before amending — measurements beat prose, including the reviewer's: the two
line numbers, `openKernel`'s create-on-miss docstring and `readonly` option, the `kernel-sole-writer`
allowlist contents, and the `tools/qf-read-tools` precedent were each re-measured. **The reader was
right on every disputed row.**

Scoreboard: WO-103 no read → 2 rework rounds; WO-103b → 0; WO-104 → 1; WO-105 → 1 plus two
structurally uncatchable blockers; WO-106 → 0; WO-106b read → 8 findings, 3 High; **WO-V1 read → 11
findings, 6 High, including a hash gate that verified nothing and a Law E tripwire the order never
mentioned.**

---

# REWORK ROUND 1 — the ruling, and what changed under it

**Status: rework, scope reduced.** Verification round 1 recorded REWORK at `52c435a` on 2026-07-27
([`evidence/wo-V1/VERIFICATION-ROUND-1.md`](evidence/wo-V1/VERIFICATION-ROUND-1.md)). Branch open,
nothing merged. This section was added when the doors were rotated on 2026-07-27; the ruling below
was made at verification time and had until then existed only in a commit message, which is not a
place a builder reads. That is the defect this section closes.

## The ruling (architect, final — unchanged)

**A declared object type with no table in this database is skipped, not fatal.** Query
`sqlite_master` once for the table set, project the intersection, and **write a plain-text note in
the run summary naming every declared type that was skipped and why.** Silence is not acceptable — a
projection that quietly omits seven types is the second-truth-store failure wearing a new costume.

Do **not** fix this by dropping `readonly: true` so the migration runs. A read-only projection must
never mutate the Kernel; migrating the founder's live database as a side effect of generating notes
would be a far worse defect than the crash.

**Gate:** point the projector at a database missing at least one declared type's table; assert it
completes successfully, projects the types that do exist, and names the skipped ones. Bait: restore
the crash-on-missing behaviour → red.

## What changed after the ruling was made — read this before you scope the round

The crash was a **symptom of database drift, not a bug in the projector.** Both live Kernels were
rebuilt on 2026-07-27 at 01:18 (originals preserved alongside as
`kernel.db.pre-wo102-20260727-011825`; restore is a `mv`). Re-measured independently during this
rotation, against `~/.collaborator/dev/worktree-ada48d49dc49/kernel.db` and
`~/.qf-peer-bus/kernel.db`:

| | Before (verification round 1) | Now (measured 2026-07-27) |
|---|---|---|
| Tables | 16 of 23 declared | **26** |
| `market_event` `instrument` `quote` `venue` `mission` `policy` `environment` | all **missing** | all **present** |
| Stale `market` · `odds_series` · duplicate `event` | present | **gone** |

**Three consequences for this round, in order:**

1. **The crash is no longer reproducible on today's databases.** It is **robustness, not a blocker.**
   Do not scope this round as though the projector is broken — it is not, on any Kernel now on disk.
2. **The ruling still stands anyway.** There is no migration runner; `SCOPES.md:105` makes
   wipe-and-recreate the ritual for a rung that renames types, with no `ALTER` story. The next rename
   re-creates this exact condition, and **no gate can see it** — gates build their fixture database
   from the same schema they check, so both sides always agree. The founder's real database was the
   only thing in the system capable of disagreeing, and nothing was watching it.
3. **The gate is now harder to build, and that is the point.** Round 1 noted "today's real Kernel is a
   valid fixture — 7 of 23 missing." **That fixture no longer exists.** The gate must construct a
   deliberately incomplete database rather than borrow a broken one, and it must do so from a source
   that is *not* the live schema, or it inherits the very blindness it exists to catch.

## The real substance of this round

The crash prevented the checking seat from ever completing a run against real data, so **two
deliverables have never been observed outside synthetic fixtures**: the artifact-body rendering path
and wikilink emission. Both pass the suite; neither has been watched against the founder's Kernel.
With the databases rebuilt, a real run can now complete — **these are the round's actual work**, and
they must be re-verified against real data before this order can pass.

---

# REWORK ROUND 2 — cold board still red (one defect)

**Status: rework.** Verification of tip `c2d69d2` on 2026-07-27 recorded REWORK
([`evidence/wo-V1/VERIFICATION-ROUND-2.md`](evidence/wo-V1/VERIFICATION-ROUND-2.md)). Branch open,
nothing merged. Round 1 substance (skip + real observation) was re-derived and holds; the cold
board does not.

## Defect 1 — `kernel-one-path` fails on the vault-projection gate

**In plain terms:** a new test file for the vault builds temporary database paths using the
filename `kernel.db`, and the gate that forbids inventing Kernel paths outside a short allowlist
was never told that file is allowed — so the whole board stays red even though the projector itself
is fine.

**Measured (verifier, cold `/tmp/verify-V1` @ `c2d69d2`):**

```
kernel-one-path G1: offenders outside allowlist:
  - tools/qf-vault-projection/src/gate.ts (kernel.db path construction/literal)
FAIL  kernel-one-path
GATE_RUNNER_EXIT=1
```

Control on `main` (no vault package): `kernel-one-path` **PASS**. So this is branch-introduced.

Builder allowlisted the projector under **Law E** (`kernel-sole-writer` OPEN / WRITE /
`PRODUCTION_NO_CREATE`) after merging K2, and ran that gate green — but never touch
`qa/gates/kernel-sole-writer.ts`'s sibling **`qa/gates/kernel-one-path.ts`**, and did not run
`kernel-one-path` in the static set they reported. Same composition class as K2 fallout: a new
fixture gate that constructs `join(dir, "kernel.db")` (lines 122 and 715) must be spelled on the
one-path allowlist the way `tools/qf-read-tools/src/harness.ts` and peer-bus harness already are.

**Fix (this round only — do not widen):**

1. Add `tools/qf-vault-projection/src/gate.ts` to `ALLOW_PREFIXES` in
   `qa/gates/kernel-one-path.ts`, with a one-line comment that it is a fixture gate constructing
   temp Kernel paths (same shape as other harnesses). Adding further vault-projection files is a
   finding to report, not a quiet edit — only add what the greps actually hit.
2. Prove: unmodified tip → `kernel-one-path` red on `gate.ts`; after allowlist → green; cold
   `bun qa/run.ts --all` → `GATE_RUNNER_EXIT=0`.
3. Do **not** re-litigate skip / bodies / wikilinks unless a gate goes red on them. Round 1
   substance was independently re-observed (5 artifacts INLINE after hash match; bait
   `no such table: competitor` → restore green).

**Out of this round:** rewriting the gate to avoid the string `kernel.db`; renaming the projector;
touching `resolveKernelPath`; WO-K3; product identity.
