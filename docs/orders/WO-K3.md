# WO-K3 — Bytes follow truth, and drift refuses writes

status: open — REWORK after dishonest D5 proof; architect correction 2026-07-28
assignee: builder
depends: WO-K2 — **done** (`c9c3bf0`). WO-K1 — **done**. WO-V1 — **done** (readonly projector
must keep working after drift carve-out lands).
closes: ROADMAP debt **#27** (object-type registry drift silent) · debt **#29** bytes half
(artifact shelf decoupled from Kernel path)
blocks: WO-N1 (hard) · WO-107b (hard — first live ingest)
ladder: **identity rung 3 of 3**

---

## Objective

Artifact bytes live under the same platform root as the Kernel, and a database whose object-type
registry disagrees with the shipping schema refuses writes (warns on readonly).

## In plain terms

The ledger and the files it points at currently live under different rules — wipe the ledger and
the files survive orphaned; point at an old ledger and the system quietly accepts it even when it
is missing half the tables the schema expects. After this order, new artifact files land next to
the platform Kernel under `~/.quantflow/`, and an obsolete or truncated database is caught at
open time instead of discovered when a tool crashes mid-query.

**If it goes wrong:** either `publish_artifact` confinement regresses (WO-106b re-opens), or every
readonly tool dies because drift throws instead of warns, or the gate still compares repo artifacts
to each other and never looks at a dirty on-disk Kernel, or legacy bytes are silently lost without
a documented rule.

---

## RULING 1 — one platform root for truth and bytes (architect, final)

**Ruled: the default artifact store is a sibling of the platform Kernel under `~/.quantflow/`.**

| Artifact | Default path |
|---|---|
| Kernel | `~/.quantflow/kernel.db` (WO-K1 — unchanged) |
| Artifact bytes | `~/.quantflow/artifacts/` |

**Ruled: one resolver owns the default, the same way `resolveKernelPath()` owns the Kernel path.**

Add `resolveArtifactRoot()` in `packages/qf-kernel` (export from `.`):

- Sole reader of `QF_ARTIFACT_ROOT` for default construction.
- Env set and non-empty → absolute + symlink-resolved; directory must already exist (**fail
  closed** — do not mkdir a typo into a new truth store).
- Env unset/empty → `~/.quantflow/artifacts/`; **parent `~/.quantflow/` may be created** (same
  ritual as the Kernel default parent).
- Return `{ path, provenance: "env" | "default" }`.

**Production writers must use the resolver, not `join(HOME, ".collaborator", "agent-artifacts")`.**
Measured offender: `collab-electron/src/main/agent-host.ts:640-644`.

**Legacy bytes:** this rung does **not** bulk-copy `~/.collaborator/agent-artifacts/`. Existing
`storage_ref` rows may still point at old absolute paths; the vault projector already handles
missing/mismatch (WO-V1). **New publishes** must land under the resolved artifact root. Record in
the report how many legacy rows remain on disk — do not "fix" them here.

**`QF_ARTIFACT_ROOT` semantics unchanged:** WO-106b confinement is **relocate, not relax**. The
six escape shapes must be re-proven against a root under `~/.quantflow/` (or gate temp dir shaped
like it) — not assumed.

## RULING 2 — drift: throw on writable, warn on readonly (architect, final)

**Ruled: object-type registry drift is detected at `attachKernel`, after the migration skip branch,
using the shipping schema as the expected side.**

Implement per [`PROPOSAL-schema-drift-detector.md`](PROPOSAL-schema-drift-detector.md) §3 — name it
**object-type registry drift**, not "schema drift":

```text
declared  ← schema.objects (compile-time)
meta      ← SELECT type_name FROM schema_meta WHERE kind = 'object'
tables    ← SELECT name FROM sqlite_master WHERE type = 'table'
```

Three drift classes:

- **missing** — declared type absent from `schema_meta`
- **retired** — `schema_meta` row no longer declared
- **inconsistent** — meta/table disagreement in **either** direction

**Pure function** (no I/O) in `packages/qf-kernel` — e.g. `detectObjectTypeRegistryDrift()` —
returns `{ ok: true } | { ok: false, missing, retired, inconsistent }`. Package-tested cold.

**Call site:** `attachKernel` after `migration.sql` skip + `EVENTS_DDL` (lines 155-164 today).

| Handle | Behaviour |
|---|---|
| **Writable** (`readonly !== true`) | **throw** a named `KernelRegistryDriftError` with the three lists; boot stops (Electron `openAppKernel` at `ipc.ts:132`, tools, species) |
| **Readonly** (`readonly === true`) | **warn** human-readable summary to **stderr**; set a **queryable** drift flag on the returned `KernelDb` (e.g. `getKernelDrift(db)` or an attached readonly field — export the accessor from `.`) |

This is the debt #27 carve-out WO-K2 was sequenced for. **Do not** make readonly projection tools
throw — WO-V1's projector opens `{ readonly: true }`.

## RULING 3 — the migration skip guard stops trusting the name alone (architect, final)

Today `attachKernel` skips `migration.sql` when a table **named** `schema_meta` exists. Measured
canary (post-merge review): a file containing **only** `CREATE TABLE schema_meta (...)` opens green,
reports `schema_meta=1`, and **`artifact` is absent**.

**Ruled: skip migration only when the file looks like a completed Kernel initialization, not merely
when the name exists.**

Minimum skip predicate (all required):

1. `schema_meta` table exists
2. **`artifact` table exists** (every shipped Kernel has artifacts; empty world still has the table)
3. `SELECT COUNT(*) FROM schema_meta WHERE kind = 'object'` ≥ **1**

If (1) holds but (2) or (3) fails → treat as **not initialized**: run migration path **only when
safe**. Because `migration.sql` uses bare `CREATE TABLE`, a file with orphan `schema_meta` cannot
be repaired in place — **writable open must throw** with a message naming incomplete initialization;
readonly may warn + set drift. **Do not** hand-edit SQL to `IF NOT EXISTS` the whole migration.

The drift detector and skip guard work together: a canary-only file should fail on writable and
surface drift/incomplete on readonly.

## RULING 4 — gates must compare disk to schema, not repo to repo (architect, final)

The WO-V1 / WO-106 failure class: gates build fresh DBs from today's `migration.sql`, so both
sides always agree. This rung adds a gate that reads a **committed dirty fixture** built from a
**pinned prior schema snapshot** — never from live `schema.ts`.

**Required fixture strategy** (pick one, document which):

- **A.** Check in `qa/fixtures/kernel-drift/prior-schema/` — a minimal snapshot export (schema
  module + generated migration for *that* snapshot only) used **only** by this gate; or
- **B.** A deterministic builder script that emits a known-bad SQLite file without importing
  today's live migration.

**Mutants** (each must go red; clean fixture green):

- drop a declared table; delete a meta row; add orphan table; truncate meta loop; **canary-only
  `schema_meta`** file.

**Coupling assertion** (precedent: `qa/gates/boot-reconcile/run.ts:63-94`): static check that
`attachKernel` still invokes the drift detector — removing the call must fail CI even if unit
tests pass.

---

## Context — measured facts (re-derive before use)

| Fact | Measured |
|---|---|
| Platform Kernel | `~/.quantflow/kernel.db` (WO-K1) |
| Artifact bytes today (app) | `~/.collaborator/agent-artifacts/` via `agent-host.ts:640-644` |
| Orphan instance | 2 files on shelf, 0 rows in app Kernel (debt #29) |
| `schema_meta` skip | table **name** only (`db.ts:155-159`) |
| Canary incomplete DB | only `schema_meta` DDL → opens, no `artifact` table |
| WO-106b confinement | six shapes at `2730a00`; `relative(root, resolved)` — do not regress |
| Readonly opens exist | WO-K2 + WO-V1 projector, query reopens in harnesses |
| No migration runner | `SCOPES.md:105-108` — detection only; remedy remains wipe-and-recreate |
| `.wo008-home` Kernel | long-lived Electron leftover — **out of scope**; do not touch |

---

## Deliverables

### D1 — `resolveArtifactRoot()` + production write path

- `packages/qf-kernel/src/resolve-artifact-root.ts` (+ tests mirroring `resolve-path.test.ts`
  shape: default creates parent, env fail-closed on missing parent, realpath).
- Export from `packages/qf-kernel` index (`.`).
- `collab-electron/src/main/agent-host.ts`: publish path uses resolver; `storage_ref` points at
  file under resolved root.
- **Electron child / MCP spawn paths:** ensure `QF_ARTIFACT_ROOT` is injected where the app
  already injects `QF_KERNEL_DB` (grep `QF_KERNEL_DB` in `collab-electron/` and species spawn
  helpers). Production servers must not rely on gate temp dirs.

### D2 — drift pure function + `attachKernel` integration

- `detectObjectTypeRegistryDrift()` — pure, typed, described (two-sentence register per
  `AGENTS.md`).
- `KernelRegistryDriftError` — named, carries drift lists.
- Writable → throw before `logKernelBoot`. Readonly → stderr warning + queryable flag.
- Boot line may append `drift=yes` when flagged (optional; if added, document).

### D3 — strengthened migration skip guard

- Implement RULING 3 in `attachKernel` before or integrated with drift call.
- Package tests: canary-only file writable → throw; readonly → warn + drift flag, no `artifact`
  queries succeeding silently.

### D4 — committed drift fixture + cold gate

- New gate: `qa/gates/kernel-drift.ts` (+ launcher wired in `qa/run.ts`).
- Builds/loads dirty DB from **pinned prior snapshot** (RULING 4).
- Asserts detector fires on every mutant; clean pinned build passes.
- Coupling assertion for `attachKernel` → detector.
- Env falsify flag planting a noop detector (forbidden: bare `exit(1)`).

### D5 — artifact root gate

- Correct the contract first: `execute("publish_artifact")` hashes and indexes bytes that already
  exist; it does **not** write the artifact file. The first builder's gate called `writeFileSync`
  itself and then called `execute()`, so it proved only publication of a gate-authored fixture while
  claiming to prove the production writer. That is a false-green gate.
- Extract the existing app write-and-publish seam into a small import-safe production helper used by
  `agent-host.ts`. It may accept the Kernel publication callback as an argument so the helper stays
  independent of Electron and of a specific SQLite adapter; it must resolve the artifact root,
  create the bytes, and then call the one sanctioned publication action.
- The gate starts with the target path absent, invokes that exact production helper, and only then
  asserts the file exists under `resolveArtifactRoot()`, the artifact row's `storage_ref` resolves to
  that file, and the row's content hash equals the bytes read back from disk.
- The gate must not pre-create the accepted artifact file or call `writeFileSync`/`writeFile` on its
  behalf. Fixture setup may create only the temp HOME/root directories and negative canaries.
- Add a coupling assertion that `agent-host.ts` imports and calls the helper. Bait the real helper's
  byte-write step to a no-op (or route it to the legacy shelf): the D5 gate must go red, naming the
  missing/out-of-root production bytes; restore must go green.
- Assert **no** `artifact` row in a fresh fixture points at a path outside the resolved root
  after a controlled publish sequence.

### D6 — WO-106b regression on relocated root

- Re-run the six escape shapes from `tools/qf-read-tools/src/gates/publish-artifact-root.ts`
  with `QF_ARTIFACT_ROOT` set to a directory under a `~/.quantflow`-shaped temp tree (not the
  old gate-only layout unless equivalent). All six must still reject; inside-root still accepts.

### D7 — allowlist / Law E hygiene

Any new QA fixture SQL lands on `DRIVER_SQL_ALLOW` with a comment (WO-V1 / dock-registry
precedent). If the drift gate opens Kernels from `qa/`, spell paths on `kernel-one-path` and
Law E allowlists — **report additions**, do not silently extend.

---

## Acceptance gates

**Builder-run:** package tests (`packages/qf-kernel`), static gates (`kernel-sole-writer`,
`kernel-one-path`, `repo-shape`, …), gate falsification transcripts below.

**Verifier-run:** cold `bun qa/verify-release.ts` in a detached worktree. This is the canonical
shipped-form verifier established by WO-CI1: frozen Electron install → unit suite → production
Electron build → every QA gate.

**G1 — drift detector cold.**

- Clean pinned fixture → `{ ok: true }`.
- Each mutant → `{ ok: false }` with expected class populated.
- Bait: force detector to return `{ ok: true }` on a mutant → gate red → restore green.

**G2 — attachKernel enforcement.**

- Writable + drift fixture → throws `KernelRegistryDriftError` before any domain write.
- Readonly + same fixture → no throw; stderr contains drift summary; `getKernelDrift(db)` (or
  equivalent) is non-null.
- Control: fresh `:memory:` or clean pinned → writable publish succeeds.

**G3 — canary incomplete DB (RULING 3).**

- File with only `schema_meta` (+ minimal row): writable → throw; readonly → warn/flag; **no**
  silent success claiming 26 tables.

**G4 — artifact root.**

- Default resolver → `~/.quantflow/artifacts/` (test uses temp HOME).
- `agent-host` publish path grep: no `.collaborator/agent-artifacts` string left in production
  publish path.
- Production-helper bait red → restore green; the accepted file is absent before the helper call and
  exists afterward with row/hash/path agreement. A gate-authored accepted file is an automatic fail.

**G5 — WO-106b six shapes** on relocated root — all red/accept as before.

**G6 — coupling.**

- Remove detector call from `attachKernel` in a bait commit → coupling assertion red → restore.

**G7 — no regression.** `bun qa/verify-release.ts` exits 0 cold; `vault-projection` still green;
WO-V1 readonly projector still opens drifted DB with warn-not-throw.

---

## Out of scope

- **Migration runner** / `ALTER` / auto-repair of drifted Kernels
- **PRAGMA table_info** column fingerprint (proposal §4 optional — follow-up debt, not this rung)
- **Bulk copy** of legacy `~/.collaborator/agent-artifacts/` (founder manual move if wanted)
- **WO-N1** product identity / `~/.collaborator` app data
- **Renaming `collab-electron/`** · **`upstream` remote** · **`.wo008-home`**
- **Unserving MCP actions** to make servers readonly
- **Changing `openAppKernel` create ritual** (WO-K2)
- **Moving vault gate** under `qa/` (WO-V1 thermo carry-forward — separate order)

---

## Report-back format

1. One plain-language sentence (no jargon).
2. Resolver paths + provenance; grep proof `agent-host` no longer uses `.collaborator/agent-artifacts`.
3. G1 mutant matrix (which mutant → which class).
4. G2 writable throw + readonly warn transcripts (stderr snippets).
5. G3 canary incomplete DB transcripts.
6. G5 six-shape re-run summary (same labels as WO-106b).
7. G6 coupling bait red→green.
8. Allowlist additions with justification.
9. Canonical `bun qa/verify-release.ts` result, cold and from a detached worktree, deferred to the
   independent verifier.

**Judgment rule:** if production needs a new allowlist entry, **report it** — do not quietly extend.

---

## Stated ritual after this lands

Wipe-and-recreate the Kernel (`SCOPES.md:105`) no longer orphans artifact bytes by default — new
publishes and the index share `~/.quantflow/`. An obsolete Kernel fails loud on write instead of
letting ingest or tools run against a lying registry. **WO-107b** may proceed after verify + merge.
