# WO-K2 — The gate can see the door, and readers are readers

status: **draft — awaiting one adversarial pre-build read before cut.** Contract from
`SCOPES.md` §"The identity rungs"; facts re-measured 2026-07-27 on `main` @ `61ce90d` (WO-K1 merged).
assignee: builder
depends: WO-K1 — **done** (`61ce90d`)
closes: ROADMAP debt #28
blocks: WO-K3 (hard — readonly carve-out has nothing to apply to until this lands), and therefore WO-107b

## Objective

Make Law E's gate able to prove its own stated property, and make a process that only reads hold a
handle that cannot write. Stop `openKernel` from minting an empty world when pointed at a typo.

## In plain terms

There is a rule that says "only the Kernel package may open the database," and a test that is
supposed to enforce it. The test looks for the wrong fingerprints — raw SQL and driver import
names — so code that walks through the Kernel's own front door (`openKernel` / `execute`) is
invisible, and the test stays green. Separately, every program that opens the database today can
also write to it, even if it only meant to read; and if you point a tool at a path that does not
exist, it quietly creates a brand-new empty database instead of refusing.

After this order the test can see the front door, programs that only read cannot write, and a typo
fails closed.

**If it goes wrong:** either the gate still cannot see `openKernel` (debt #28 survives), or every
fixture harness breaks because create-on-miss flipped without an explicit create option, or a
"reader" still holds a writable handle and WO-K3's drift carve-out has nowhere to land.

---

## RULING 1 — two claims, reported separately (architect, final)

Today `kernel-sole-writer` conflates *opens the Kernel* and *writes domain rows*. Calling
`execute()` from outside the package is the **sanctioned** write path — that is not a Law E
violation. What is false is the docstring's weaker claim: *only `packages/qf-kernel` may open
SQLite*.

**Ruled:** the gate reports **two lists**:

1. **Open offenders** — files outside the allowlist that call `openKernel` / `openAppKernel`
   (or import a SQLite driver / issue raw domain DDL/DML — the existing patterns stay).
2. **Write offenders** — files outside the allowlist that call `execute(` on a Kernel handle,
   *unless* they are on an explicit write-path allowlist (the sanctioned callers).

A file may appear on neither, one, or both. The gate must say which claim failed. A single
"offender" blob that does not say *why* recreates the blindness.

## RULING 2 — create is opt-in; `:memory:` and the app boot are carved out (architect, final)

**Ruled:** `openKernel(path)` on a **file** path that does not exist **throws**. Creating a new
file-backed Kernel requires an explicit option: **`{ create: true }`**. The name is spelled here.

| Path | Missing file, no `create` | Missing file, `create: true` |
|---|---|---|
| File path | **throws** — creates nothing | creates + migrates (today's behaviour) |
| `:memory:` | n/a — always opens | n/a |

**`openAppKernel` keeps creating.** It does not call `openKernel`; it uses `DatabaseSync` after
`resolveKernelPath()`. First-launch empty canvas is a stated ritual from WO-K1. Do not pull
fail-closed create into the Electron boot in this order — that would strand a fresh machine.

**Mechanism, not a property:** `openKernel` in `db-bun.ts` checks `existsSync` (or equivalent) for
non-`:memory:` paths when `opts.create !== true`, and throws a named error before `new Database`.
Do not rely on SQLite's own failure mode — it creates.

## RULING 3 — reader vs writer is classified by what the process does, not by its package name

A call site is a **writer** if it ever calls `execute` or must apply migrations / create.
A call site is a **reader** if it only queries and never needs to create.

**Measured on `main` @ `61ce90d` — zero production readers today.** Every file-backed site either
calls `execute` or creates fixtures. That is not a defect in this order; it is the starting census.
The deliverable is still: classify every site, put `readonly: true` on every site classified
reader, and prove a readonly handle cannot write.

**Known future reader (do not implement here):** `tools/qf-vault-projection` on branch `wo-V1`
already opens `{ readonly: true }` and asserts the file exists. This order must not break that
shape — WO-K1 already made `attachKernel` skip WAL/synchronous on readonly. Re-confirm that path
still works when you flip create-on-miss (readonly + missing file must throw, not create).

---

## Context — measured facts (verify before use)

Re-measured 2026-07-27 on `main` after WO-K1. Cite-or-probe: if a fact does not reproduce, stop.

| Fact | Measured |
|---|---|
| `openKernel(..., { readonly: true })` call sites on `main` | **zero** |
| `openKernel` creates a missing file today | **yes** — probed: before false → after true |
| `attachKernel` already skips `journal_mode` / `synchronous` when `readonly` | yes (`db.ts`, WO-K1 D3) |
| `busy_timeout` still set on readonly | yes — correct; keep |
| `kernel-sole-writer` matches `openKernel` / `execute` | **no** — only driver strings + SQL keywords |
| `QF_*_FALSIFY` path on `kernel-sole-writer` | **none** (unlike `dock-registry`) |
| File-backed `openKernel` outside `packages/qf-kernel` | see census table below |
| `openAppKernel` | always writer; creates via `DatabaseSync`; governed by `kernel-sole-writer-app` |

### Census — file-backed `openKernel` outside `packages/qf-kernel` (classify in the report)

Every row must appear in the builder report as **writer** or **reader** with one-line reason.
Counts are call sites, not files. Re-count before building — if the tree moved, update the table
in the report, do not invent allowlist entries silently.

| File | Role today (architect seed — builder confirms) |
|---|---|
| `tools/qf-read-tools/src/server.ts` | **writer** — serves action tools via `execute` |
| `tools/qf-peer-bus/src/bus.ts` | **writer** — `execute` for `publish_artifact` |
| `tools/qf-peer-bus/scripts/setup-founder-seats.ts` | **writer / creator** — must gain `{ create: true }` |
| `species/hermes/register.ts` | **writer** — `execute` |
| `species/critic-mock/register.ts` | **writer** — `execute` |
| `tools/qf-read-tools/src/harness.ts` | **writer / creator** — fixture DB; `{ create: true }` |
| `tools/qf-read-tools/src/gates/{tool-discovery,action-transport,publish-artifact-root,kernel-one-world}.ts` | **writer / creator** — fixtures; `{ create: true }` on first open |
| `tools/qf-peer-bus/src/harness.ts` | **writer / creator** — fixtures; `{ create: true }` |

`:memory:` call sites (qa gates, kernel tests, host-admit, a2a smoke) are **not** file-backed create
hazards; they keep working without `create: true`.

**If the builder finds a site that only reads** (no `execute`, no create need): classify **reader**,
pass `{ readonly: true }`, and do **not** pass `create: true`.

---

## Deliverables

### D1 — `openKernel` create is opt-in

`packages/qf-kernel/src/db-bun.ts`: file path + missing + `create !== true` → throw before open.
Error message must name the path and say `create: true` is required. `:memory:` unchanged.
Export the option type from `.` and `./portable` if callers need the type.

**Electron path out of scope for the throw** — see RULING 2.

### D2 — every creator passes `{ create: true }`

Same commit as D1. Every harness / gate / setup script that builds a fresh file-backed Kernel
passes the flag. **If the suite reddens because a site was missed, that is a D2 defect, not a
reason to weaken D1.**

Spelled starters (re-grep; do not treat this as exhaustive if new sites appeared):

- `tools/qf-peer-bus/scripts/setup-founder-seats.ts`
- `tools/qf-read-tools/src/harness.ts` and its gates listed in the census
- `tools/qf-peer-bus/src/harness.ts`
- `packages/qf-kernel/src/busy-timeout.test.ts` (file-backed setup opens)

Production servers pointed at an **existing** platform Kernel (`server.ts`, `bus.ts`) must **not**
pass `create: true` — a missing platform Kernel after WO-K1 is an operator error, not a cue to mint
a second world.

### D3 — classify every file-backed site; readers get `{ readonly: true }`

Report table: path · reader|writer · reason · opts passed.
Every **reader** passes `{ readonly: true }`.
Every **writer** that creates passes `{ create: true }`; writers that only open an existing file
pass neither create nor readonly.

### D4 — readonly handle cannot write (proof site)

A package test (in `packages/qf-kernel`): create a Kernel with `{ create: true }`, reopen
`{ readonly: true }`, attempt a write (`exec` INSERT or `execute(...)`) → **must throw**.
Control: same file reopened without readonly → write succeeds.

This is the property WO-K3's carve-out will need. Do not leave it as a comment.

### D5 — `kernel-sole-writer` sees the front door

Extend `qa/gates/kernel-sole-writer.ts`:

1. Keep existing driver / SQL patterns.
2. Add patterns for `\bopenKernel\s*\(` and `\bopenAppKernel\s*\(` (open claim).
3. Add pattern for `\bexecute\s*\(` (write claim) — **with a separate allowlist** for sanctioned
   write callers (RULING 1).
4. Docstring rewritten to match what the gate actually proves. **A docstring that overclaims is
   how debt #28 was born — do not replace one lie with another.** State the grep limits the same
   way the file already admits for dynamic SQL.

**Open allowlist** — who may call `openKernel` / `openAppKernel` outside `packages/qf-kernel/`:

Spelled here. Adding an entry is a **finding to report**, not a quiet edit — same rule as WO-K1 G1.

- `packages/qf-kernel/` (definition)
- `collab-electron/` (governed by `kernel-sole-writer-app`; do not duplicate)
- `qf-kernel-schema/`
- `qa/gates/kernel-sole-writer.ts`, `qa/gates/kernel-sole-writer-app.ts`
- `tools/qf-read-tools/src/server.ts`
- `tools/qf-read-tools/src/harness.ts`
- `tools/qf-read-tools/src/gates/tool-discovery.ts`
- `tools/qf-read-tools/src/gates/action-transport.ts`
- `tools/qf-read-tools/src/gates/publish-artifact-root.ts`
- `tools/qf-read-tools/src/gates/kernel-one-world.ts`
- `tools/qf-peer-bus/src/bus.ts`
- `tools/qf-peer-bus/src/harness.ts`
- `tools/qf-peer-bus/scripts/setup-founder-seats.ts`
- `species/hermes/register.ts`
- `species/hermes/host-admit-kernel.ts`
- `species/hermes/a2a-4tile-smoke.ts`
- `species/critic-mock/register.ts`
- `qa/gates/dock-registry/run.ts`
- `qa/gates/boot-reconcile/run.ts`
- `qa/gates/agent-path/run.ts`

**Write allowlist** — who may call `execute(` outside `packages/qf-kernel/`:

Start from every current non-package `execute(` callsite the builder greps on day one; seed at
minimum includes the tool plane, peer-bus, species register scripts, and qa gates that drive
actions. **Publish the final list in the report.** If a file is on the open allowlist but not the
write allowlist, it may open and query but must not call `execute`.

`tools/qf-peer-bus/src/bus.ts` keeps its existing exemption for **transport** `bun:sqlite` (inbox
DB) — that is not Kernel DDL. Do not collapse the two.

### D6 — durable falsify path

`kernel-sole-writer` gains an env-flag bait path, same shape as `dock-registry`:

- **`QF_KERNEL_SOLE_WRITER_FALSIFY_OPEN=1`** — gate internally considers a synthetic open offender
  (or writes a temp bait file under a scanned path, then removes it) and **must exit non-zero**.
- **`QF_KERNEL_SOLE_WRITER_FALSIFY_WRITE=1`** — same for the write claim.

Both flags documented in the gate file header. Default (unset) → normal scan.
A gate with no durable red path is decoration — that is half of debt #28.

**Do not** leave bait files in the tree after the run. `git status` clean of bait.

### D7 — gate still catches raw SQL (regression control)

The existing Control 2 from the post-merge review must keep working: a file with `bun:sqlite` +
`INSERT INTO` outside allowlists → red. Do not gut the old patterns while adding the new ones.

---

## Acceptance gates

Every gate proven by bait. A gate whose red path was never observed is decoration.

**G1 — front door visible.** Control 1: unmodified tree → green.
Control 2: file with `bun:sqlite` + `INSERT INTO` under `tools/` (temp) → red on driver/SQL claim.
Bait: file with `openKernel(...); execute(...)` and **no** driver string / SQL keyword → **red**,
naming the open and/or write claim. Remove bait → green, tree clean.

**G2 — falsify flags.**
`QF_KERNEL_SOLE_WRITER_FALSIFY_OPEN=1 bun qa/run.ts --only kernel-sole-writer` → non-zero.
Same for `_FALSIFY_WRITE=1`. Unset → green.

**G3 — create fail-closed.**
`openKernel` on a missing file path without `create: true` → throws, file still absent.
Control: `{ create: true }` → file appears and opens.
`:memory:` still opens without `create`.

**G4 — readonly cannot write.** Package test from D4: readonly write throws; writable control
succeeds.

**G5 — no regression.** Full suite cold, `GATE_RUNNER_EXIT=0`. `kernel-one-path`,
`kernel-sole-writer-app`, `publish-artifact-root` still green. If create-on-miss flip reddens a
harness, that is D2 unfinished — fix the harness, do not revert D1.

---

## Out of scope

Drift detection / empty-`schema_meta` guard (WO-K3) · artifact root relocation (WO-K3) · changing
`openAppKernel` create behaviour · widening `kernel-sole-writer-app` · migration runner · rewriting
WO-V1 (lands on its own branch; this order must not break its `{ readonly: true }` shape) ·
changing which MCP tools are served.

## Report-back format

Per `VERIFYING.md`. Additionally:

1. Census table: every file-backed site · reader|writer · opts · reason.
2. G1 bait transcript (Control 1, Control 2, openKernel+execute bait, restore) — both claims named.
3. G2 falsify-flag transcripts for OPEN and WRITE.
4. G3 throw message + proof the missing path was not created; create:true control.
5. G4 readonly failure + writable control.
6. Final open allowlist and write allowlist as shipped (diff against this order's seed called out).
7. Confirmation `git status` clean of bait files.

**Judgment the order expects you to surface:** if D5's seed allowlists are incomplete, **report the
finding and propose the entry** — do not silently extend. Same discipline as WO-K1 G1.

---

## Stated ritual

After this lands, a tool pointed at a wrong path **refuses** instead of creating a parallel empty
Kernel. That closes the pressure valve that produced the four absolute pins WO-K1 stripped.
First app launch on a fresh machine still creates via `openAppKernel` — unchanged.
