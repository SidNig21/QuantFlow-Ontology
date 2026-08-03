# WO-K2 — The gate can see the door, and readers are readers

status: **done — verified + merged 2026-07-27**, zero rework rounds.
Record: [`evidence/wo-k2/VERIFICATION.md`](evidence/wo-k2/VERIFICATION.md).
Pre-build: one adversarial read (DO NOT CUT → ten findings fixed)
([`evidence/wo-k2/prebuild-read.md`](evidence/wo-k2/prebuild-read.md)). Builder tip `c9c3bf0`.
assignee: builder (verified by architect seat)
depends: WO-K1 — **done** (`61ce90d`)
closes: ROADMAP debt #28 — **closed**
blocks: WO-K3 (readonly API + gate teeth shipped; production projection readers arrive with WO-V1).
Still ahead of WO-107b.

---

## VERIFICATION (2026-07-27)

**PASS.** Cold `/tmp/verify-k2` @ `c9c3bf0`, `GATE_RUNNER_EXIT=0` (21 gates). All baits
re-run by verifier: G1 controls, G1b open∩¬write, falsify OPEN/WRITE with offender lines,
G3b create-ban, D7 F1 SQL-on-open-allowlisted, package create/readonly tests 6/6.
Judgment accepted: query-only reopens as readers; create-ban claim inside same gate.
Full receipts: [`evidence/wo-k2/VERIFICATION.md`](evidence/wo-k2/VERIFICATION.md).

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

**If it goes wrong:** either the gate still cannot see `openKernel` (debt #28 survives), or blessing
legitimate openers accidentally stops the gate from checking them for raw SQL, or every fixture
harness breaks because create-on-miss flipped without an explicit create option, or a "reader"
still holds a writable handle.

---

## RULING 1 — three claims, three allowlists, never one skip (architect, final)

Today `kernel-sole-writer` conflates everything into one whole-file allowlist: if a file is
allowed, **no pattern runs on it**. That is how adding an open allowlist would gut the SQL scan
on every newly blessed opener — measured composition defect in the pre-build read.

**Ruled: the gate evaluates three independent claims. Membership on one allowlist never skips the
others.**

| Claim | What it matches | Allowlist meaning |
|---|---|---|
| **Driver/SQL** | existing patterns (`bun:sqlite`, `INSERT INTO`, …) | today's narrow `ALLOW_PREFIXES` — who may talk to SQLite / issue raw DDL/DML |
| **Open** | `\bopenKernel\s*\(` · `\bopenAppKernel\s*\(` | who may call the Kernel front door |
| **Write** | `\bexecute\s*\(` on comment-stripped text | who may call the sanctioned write path |

A file may fail any combination. The gate **must name which claim(s)** failed. Calling `execute()`
from outside the package is the sanctioned write path — that is not a Law E spirit violation; it
must appear on the write allowlist. What was false is the docstring's weaker claim that only
`packages/qf-kernel` may *open* SQLite.

**Mechanism for comment false-positives.** Before matching `execute(`, strip `//` line comments and
`/* */` block comments from the file text. Measured: `server.ts:6` and `register.ts` doc comments
contain the string `execute(` and would otherwise force `server.ts` onto the write list for no
callsite.

## RULING 2 — create is opt-in; `:memory:` and the app boot are carved out (architect, final)

**Ruled:** `openKernel(path)` on a **file** path that does not exist **throws**. Creating a new
file-backed Kernel requires **`{ create: true }`**. The name is spelled here.

| Path / opts | Behaviour |
|---|---|
| File missing, no `create` | **throws** — creates nothing |
| File missing, `{ create: true }` | creates + migrates (today's behaviour) |
| `:memory:` | always opens; `create` irrelevant |
| `{ create: true, readonly: true }` together | **throws** — mutually exclusive; do not invent a meaning |
| File missing, `{ readonly: true }` | **throws** (readonly cannot create) |

**`openAppKernel` keeps creating.** It does not call `openKernel`; it uses `DatabaseSync` after
`resolveKernelPath()`. First-launch empty canvas is a stated ritual from WO-K1. Do not pull
fail-closed create into the Electron boot in this order.

**Mechanism:** `openKernel` in `db-bun.ts` checks existence for non-`:memory:` paths when
`opts.create !== true`, and throws a named error **before** `new Database`. Do not rely on
SQLite's failure mode — it creates.

**Type export:** `OpenKernelOptions` (or equivalent) exports from `qf-kernel` (`.`) only.
`qf-kernel/portable` deliberately does not open bun:sqlite — do not pretend it exports `openKernel`.

## RULING 3 — classify per call site; zero production readers today is honest, not a hole in this rung

A **call site** is a **writer** if that site's process path calls `execute` or must create.
A **call site** is a **reader** if it only queries an existing file and never creates.

**Measured on `main` @ `61ce90d`:** zero `{ readonly: true }` openKernel sites on the tree (only
the option plumbing in `db-bun.ts`). Every production file-backed opener either calls `execute`
(via itself or a collaborator in-process) or creates. That is the starting census, not a defect.

**What this rung owes WO-K3:** the readonly **API** that already survives `attachKernel` (WO-K1),
the fail-closed create flip, the D4 proof that readonly cannot write, and gate teeth that can see
`openKernel`. **What it does not owe:** converting `qf-read-tools` into a read-only server (that
would mean unserving actions — out of scope). Production projection readers arrive with **WO-V1**
(`tools/qf-vault-projection` already opens `{ readonly: true }` on that branch). WO-K3's order must
not assume every handle on the machine is readonly after this lands — only that the carve-out is
implementable.

**Per call site, not per file.** A harness that creates once and later re-opens the same path for
queries: the create site gets `{ create: true }`; a later re-open of an existing file that never
executes may pass neither `create` nor `readonly` (writer-shaped reopen) **or** `{ readonly: true }`
if that site is classified reader. Pick one per site and record it. Do not classify a whole file as
one thing when call sites differ.

---

## Context — measured facts (verify before use)

Re-measured 2026-07-27 on `main` after WO-K1 + pre-build read. Cite-or-probe.

| Fact | Measured |
|---|---|
| `openKernel(..., { readonly: true })` on `main` | **zero** call sites |
| `openKernel` creates a missing file today | **yes** — before false → after true |
| `attachKernel` skips `journal_mode` / `synchronous` when readonly | yes (WO-K1); `busy_timeout` still set — keep |
| `kernel-sole-writer` whole-file skip | `isAllowed` → `continue` before any pattern — **the composition trap** |
| `QF_*_FALSIFY` on `kernel-sole-writer` | **none** |
| File-backed `openKernel` outside `packages/qf-kernel` | **23 call sites · 11 files** (was "22/10" in SCOPES — corrected here) |
| `execute(` real callers outside package (excl. collab-electron, schema) | see write allowlist below; includes **`tools/qf-read-tools/src/register.ts`** which has **no** `openKernel` |
| Comment false positives for `\bexecute\s*\(` | `server.ts:6`, `register.ts` docs, `harness.ts` header, gate comments |

### Census — file-backed sites (builder confirms + classifies per call site)

| File | Seed role |
|---|---|
| `tools/qf-read-tools/src/server.ts` | **writer** (opens; actions run via `register.ts` → `execute`) — **no** `create: true` |
| `tools/qf-read-tools/src/register.ts` | **write path only** — no open; must be on **write** allowlist |
| `tools/qf-peer-bus/src/bus.ts` | **writer** — `execute`; **no** `create: true` (open existing) |
| `tools/qf-peer-bus/scripts/setup-founder-seats.ts` | **creator** — `{ create: true }` |
| `species/hermes/register.ts` · `species/critic-mock/register.ts` | **writer** — open existing path from CLI; **no** `create: true` |
| Harnesses / gates listed under open allowlist | **creator** on first open — `{ create: true }`; re-opens classified per site |

---

## Deliverables

### D1 — `openKernel` create is opt-in

`packages/qf-kernel/src/db-bun.ts` per RULING 2. Named throw before `new Database`. Mutual exclusion
of `create` and `readonly`. `:memory:` unchanged. Type exported from `.` only.

### D2 — every creator passes `{ create: true }`; production openers never do

Same commit as D1.

**Must gain `{ create: true }` on first file-backed create** (re-grep; not exhaustive if tree moved):

- `tools/qf-peer-bus/scripts/setup-founder-seats.ts`
- `tools/qf-read-tools/src/harness.ts` and gates:
  `tool-discovery.ts`, `action-transport.ts`, `publish-artifact-root.ts`, `kernel-one-world.ts`
- `tools/qf-peer-bus/src/harness.ts` — **and sequencing (F10):** before spawning the bus subprocess,
  the harness (or gate) must `openKernel(path, { create: true })` (then may close) so the child
  `bus.ts` can open the existing file **without** `create: true`. Today create-on-miss hides this
  order; after D1 the bus will fail closed if the harness does not pre-create.
- `packages/qf-kernel/src/busy-timeout.test.ts` file-backed setups

**Must NOT contain `create: true`:**

- `tools/qf-read-tools/src/server.ts`
- `tools/qf-peer-bus/src/bus.ts`
- `species/hermes/register.ts`
- `species/critic-mock/register.ts`

If the suite reddens because a creator was missed, that is a D2 defect — fix the site, do not
weaken D1.

### D3 — classify every file-backed call site; readers get `{ readonly: true }`

Report table: **file:line** · reader|writer|creator · opts · reason.
Every **reader** → `{ readonly: true }`.
Every **creator** → `{ create: true }`.
Writers that only open an existing file → neither flag.

### D4 — readonly handle cannot write (proof site)

Package test: `{ create: true }` → close → reopen `{ readonly: true }` → write (`exec` INSERT or
`execute`) **throws**. Control: reopen without readonly → write succeeds.

### D5 — `kernel-sole-writer` sees the front door (per-claim)

Rewrite `qa/gates/kernel-sole-writer.ts`:

1. Keep driver/SQL patterns and **today's** narrow allowlist for that claim only
   (`packages/qf-kernel/`, `qf-kernel-schema/`, the two gate files, `tools/qf-peer-bus/src/bus.ts`
   transport exemption, `collab-electron/`, `qa/gates/dock-registry/run.ts` as today).
2. Add **open** patterns + **open allowlist** (below).
3. Add **write** pattern on **comment-stripped** text + **write allowlist** (below).
4. **Never** `if (onOpenAllowlist || onWriteAllowlist) continue` before driver/SQL checks.
5. Docstring matches reality. State grep limits. Do not replace one overclaim with another.

**Open allowlist** (who may call `openKernel` / `openAppKernel` outside `packages/qf-kernel/`):

Adding an entry is a **finding to report**, not a quiet edit.

- `collab-electron/` (still governed by `kernel-sole-writer-app` for app-tree rules)
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
- `qa/gates/kernel-sole-writer.ts` / `qa/gates/kernel-sole-writer-app.ts` (if they mention the names)

**Write allowlist** (who may call `execute(` outside `packages/qf-kernel/`, after comment-strip):

- `tools/qf-read-tools/src/register.ts` — **required; has no openKernel**
- `tools/qf-read-tools/src/harness.ts`
- `tools/qf-read-tools/src/gates/action-transport.ts`
- `tools/qf-read-tools/src/gates/kernel-one-world.ts`
- `tools/qf-peer-bus/src/bus.ts`
- `species/hermes/register.ts`
- `species/hermes/host-admit-kernel.ts`
- `species/hermes/a2a-4tile-smoke.ts`
- `species/critic-mock/register.ts`
- `qa/gates/dock-registry/run.ts`
- `qa/gates/boot-reconcile/run.ts`
- `qa/gates/agent-path/run.ts`
- `collab-electron/` (app tree; `kernelExecute` → `execute`)

**Not on write allowlist (open-only examples):** `server.ts`, `tool-discovery.ts`,
`publish-artifact-root.ts`, `setup-founder-seats.ts` — they must not call `execute(` after
comment-strip. G1b proves that.

`tools/qf-peer-bus/src/bus.ts` keeps its **driver/SQL** exemption for the transport inbox DB only
— that exemption is claim-scoped, not a blanket skip.

### D6 — durable falsify path through the real scanner

Env flags (document in the gate header):

- `QF_KERNEL_SOLE_WRITER_FALSIFY_OPEN=1`
- `QF_KERNEL_SOLE_WRITER_FALSIFY_WRITE=1`

**Mechanism (dock-registry shape, not forged exit):** the flag causes the gate to plant a temp
bait file under a **scanned, non-allowlisted** path (or neuter a real check so the real assertion
fails), run the **same** offender accumulation/reporting path, exit non-zero naming the claim, then
remove the bait. **`if (env) process.exit(1)` is forbidden** — that satisfies the flag text and
proves nothing about G1's matcher (WO-004 class).

`git status` clean of bait after the run.

### D7 — raw SQL regression still holds on allowlisted openers

Control 2 remains: temp file with `bun:sqlite` + `INSERT INTO` outside **driver/SQL** allowlist →
red.

**Additional control (F1):** a file that is on the **open** allowlist but contains raw
`INSERT INTO` (and is not on the driver/SQL allowlist) → **still red on the driver/SQL claim**.
That is the proof that open membership does not skip SQL. Implement as a temp edit of a copy or a
dedicated bait path the gate scans — not by permanently dirtying `server.ts`.

---

## Acceptance gates

**G1 — front door visible.**
- Control 1: unmodified tree → green.
- Control 2: temp `bun:sqlite` + `INSERT INTO` under `tools/` outside driver/SQL allowlist → red.
- Bait A: temp file with `openKernel(...); execute(...)`, no driver/SQL keyword, outside open and
  write allowlists → **red**, naming open and/or write claims.
- Restore → green, tree clean.

**G1b — open∩¬write is enforceable.**
Bait: a file **on the open allowlist** (use a path already listed, via temp overlay / scanned copy
the gate will see, or a documented test double path) that contains a real `execute(` callsite and
is **not** on the write allowlist → **red on the write claim only**. Restore. Without G1b, RULING 1
is commentary.

**G2 — falsify flags exercise the scanner.**
`QF_KERNEL_SOLE_WRITER_FALSIFY_OPEN=1` → non-zero **and** offender output names the open claim via
the same reporting path as G1. Same for `_FALSIFY_WRITE=1`. Unset → green. Bare exit = fail the
order.

**G3 — create fail-closed.**
Missing file without `create: true` → throws; path still absent.
`{ create: true }` → file appears.
`:memory:` opens without `create`.
`{ create: true, readonly: true }` → throws.

**G3b — production openers never create.**
Gate or report-back grep: `server.ts`, `bus.ts`, `species/*/register.ts` contain **no**
`create:\s*true`. Bait: add it to `server.ts` → red → restore → green.

**G4 — readonly cannot write.** D4 package test + writable control.

**G5 — no regression.** Full suite cold, `GATE_RUNNER_EXIT=0`. `kernel-one-path`,
`kernel-sole-writer-app`, `publish-artifact-root` green. Missed `{ create: true }` on a fixture
creator is D2 unfinished.

---

## Out of scope

Drift detection / empty-`schema_meta` (WO-K3) · artifact root relocation (WO-K3) · changing
`openAppKernel` create behaviour · widening `kernel-sole-writer-app` · migration runner · unserving
MCP action tools to make `server.ts` a reader · rewriting WO-V1 (must not break its
`{ readonly: true }` shape when it merges).

## Report-back format

1. Census table: **file:line** · reader|writer|creator · opts · reason.
2. G1 + G1b + Control 2 transcripts (claims named); tree clean after.
3. G2 falsify transcripts showing **offender lines**, not only exit codes.
4. G3 throw + no file created; create control; create+readonly throw.
5. G3b bait on `server.ts` red→restore.
6. G4 readonly failure + writable control.
7. Final open allowlist and write allowlist as shipped; any addition called out as a finding.
8. Peer-bus harness sequencing note (pre-create before spawn).
9. `GATE_RUNNER_EXIT=0` cold.

**Judgment rule:** if an allowlist entry is missing, **report and propose** — do not silently
extend. Same discipline as WO-K1 G1.

---

## Stated ritual

After this lands, a tool pointed at a wrong path **refuses** instead of creating a parallel empty
Kernel. First app launch on a fresh machine still creates via `openAppKernel` — unchanged.
