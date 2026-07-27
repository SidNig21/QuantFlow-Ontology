# WO-K1 — One Kernel path, and they take turns

status: **draft — two adversarial reads run, both returned DO NOT CUT; all findings now fixed in this
text.** Round 1 2026-07-27 (`grok-4.5-high`): 5 High, plus 1 Critical the architect found while
verifying them. Round 2 2026-07-27 (`composer-2.5`, decorrelated): graded round 1's fixes — 6 FIXED,
**2 only ACKNOWLEDGED** — and found 3 further High in the new material. Records:
[`evidence/wo-k1/prebuild-read.md`](evidence/wo-k1/prebuild-read.md) and
[`evidence/wo-k1/prebuild-read-round2.md`](evidence/wo-k1/prebuild-read-round2.md).
**Cuttable once an architect confirms round 2's four required changes are present** — they are
written into D3, D6, D8 and G4 below and did not change any ruling
assignee: builder
depends: nothing — this is the floor
closes: the WO-K1 half of ROADMAP debt #29; **does not** close #28 (WO-K2) or #27 (WO-K3)
blocks: WO-K2, WO-K3, and therefore WO-107b

## Objective

Make the Kernel one file, resolved by one function, and safe for more than one process to hold open
at the same time. Both halves ship together or neither ships — see RULING 2.

## In plain terms

The system keeps its records in a database. Right now there are three of those databases and nothing
is shared between them. The app looks in one place, the agent seats look in another, and a third is
a week-old leftover. Nobody ever wrote down the sentence *"there is exactly one database, and it is
here"*, so every program works the answer out for itself and they disagree.

After this order there is one database, at `~/.quantflow/kernel.db`, and every program asks the same
function where it is. Every program also prints which database it opened when it starts, so the next
time this goes wrong it is visible in one second instead of one review.

There is a trap in the obvious version of this fix, and it is the reason this order is bigger than
"change a path" — see RULING 2.

**If it goes wrong:** the app opens an empty canvas (expected — see *Stated ritual*), or two programs
fight over the one database and fail at random moments, or a program keeps its own private path and
the split silently survives the fix.

---

## RULING 1 — one isolation mechanism, not two (architect, final)

The scope contract said per-worktree Kernel isolation "survives as an explicit, logged opt-in." A
builder could read that as *add a second env var* (`QF_KERNEL_WORKTREE` or similar) alongside
`QF_KERNEL_DB`.

**Ruled: there is exactly one mechanism, and it is `QF_KERNEL_DB`.** A developer who wants an
isolated Kernel sets `QF_KERNEL_DB` to the path they want. Two mechanisms would be two things that
must agree about which one wins — the second-truth-store shape `SCOPES.md` §5.2 forbids, and the
precise shape that produced this order.

`COLLAB_DIR` stops feeding the Kernel path entirely. It keeps feeding app-local state (canvas,
config, PTY logs, sockets, terminals), which is correct as it stands. **Per-worktree isolation is
not the defect. Per-worktree *truth* is.**

## RULING 2 — WAL and `busy_timeout` ship in this order, not a later one (architect, final)

This is the correction that makes the order bigger than the review's K1 sketch, so the reasoning is
recorded rather than assumed.

Today the three processes never contend, because they never share a file. **The isolation defect is
also the only thing preventing a liveness defect.** `packages/qf-kernel/src/db.ts:71` sets exactly
one pragma (`foreign_keys = ON`), so SQLite runs at its defaults: rollback journal, `busy_timeout`
of **zero**.

Unify the path without the concurrency settings and three processes land on one file with no wait:
a long-lived Electron write handle (`kernel.ts:49-61`, `BEGIN IMMEDIATE` at `:35`), the
`qf-read-tools` server (`server.ts:32`, read-write today even though it serves only read tools), and
`qf-peer-bus`.

**Corrected at the pre-build read — the conclusion holds, the original reason did not.** The first
draft of this ruling said "under a rollback journal a writer locks readers out entirely." That is
**wrong**, and the correction changes which knob a builder must respect. Measured, two processes:

| | second writer, first holding `BEGIN IMMEDIATE` | readers during a writer's commit |
|---|---|---|
| rollback journal, `busy_timeout=0` | **fails immediately** | 721 ok / 1 locked |
| **WAL**, `busy_timeout=0` | **fails immediately** | 724 ok / 0 locked |
| rollback journal, `busy_timeout=2000` | succeeds (~229 ms) | — |
| WAL, `busy_timeout=2000` | succeeds (~229 ms) | — |

So: **`busy_timeout` is what makes writers take turns. WAL alone does nothing for writer-versus-writer.**
Readers were never locked out for the whole write — they blip only during the brief exclusive phase
of commit, which WAL removes. WAL earns its place here for the reader blip and for the create/write
cost below; the timeout earns its place for turn-taking. A builder who ships WAL, watches the speed
improve, and under-tests the timeout would leave the actual defect in place. **G2's control is the
load-bearing gate in this order.**

The failures would be **intermittent**, because app writes are brief. An intermittent fault presents
as a different bug every time it is hit. Shipping the path unification alone would trade a defect
that is currently harmless for one that is expensive to diagnose.

Durability is **not** traded for this. Measured on this machine 2026-07-27, `migration.sql` at
37,402 bytes on dm-crypt-over-SATA:

| Configuration | Create | Per write | Durability |
|---|---|---|---|
| As shipped (rollback journal, `synchronous=FULL`) | 31,990 ms | 370.4 ms | full |
| **WAL, `synchronous=FULL`** | **8,287 ms** | **87.5 ms** | **full — unchanged** |
| WAL, `synchronous=NORMAL` | 537 ms | <1 ms | relaxed |

**The real Kernel takes row 2** — 3.9× faster to create, 4.2× faster per write, and nothing about
durability changes. Row 3 is for test fixtures only and is fenced by D5.

## RULING 3 — the default may create; the environment variable may not (architect, final)

The review measured that `openKernel` on a path whose parent does not exist throws `SQLITE_CANTOPEN`,
because `db-bun.ts` does not `mkdir` while `openAppKernel` does at `kernel.ts:54`. That asymmetry is
currently accidental. This order makes it deliberate and inverts nothing:

- Path came from the **default** → the resolver ensures the parent directory exists. A fresh machine
  must work.
- Path came from **`QF_KERNEL_DB`** → never create the parent. **Fail closed.** A typo in an env var
  must not mint an empty world, and — under the as-shipped timings above — must not stall the caller
  for 32 seconds while doing it.

Creating the *database file* itself stays as it is today. Refusing to create databases at all is
WO-K2's deliverable, not this one; do not pull it forward.

---

## Context — measured facts (verify before use)

Every row re-measured 2026-07-27 on the live machine. Cite-or-probe applies: if a fact below does
not reproduce, stop and report rather than building around it.

| Fact | Measured |
|---|---|
| `~/.qf-peer-bus/kernel.db` | 26 tables, **0 events**, 0 artifacts |
| `~/.collaborator/dev/worktree-ada48d49dc49/kernel.db` (the app) | 26 tables, **0 events**, 0 artifacts |
| `.wo008-home/.collaborator/dev/worktree-ada48d49dc49/kernel.db` | 22 tables, 5 events, 1 artifact — **stale, and held open by PIDs 830148 / 831800** |
| Total shared truth across the system | **zero** |
| `~/.quantflow/` | exists, **empty** — nothing to migrate |
| `packages/qf-kernel/src/db.ts:71` | sets `foreign_keys` only; no `journal_mode`, `synchronous`, or `busy_timeout` anywhere in the repo |
| `openAppKernel` (`kernel.ts:52-61`) | builds its own path from `COLLAB_DIR`; ignores `QF_KERNEL_DB` |
| `getKernelPath()` (`kernel.ts:68`) | **zero callers.** (The review called this `getKernelDbPath()`; **no function of that name exists** — do not go looking for it) |
| `COLLAB_DIR` (`paths.ts:24-36`) | `sha256(cwd)[:12]`, DEV only |
| File-backed `openKernel` call sites outside `packages/qf-kernel` | **22, across 10 files** |
| …of those, passing `{ readonly: true }` | **zero** — WO-K2's problem, named here only so it is not mistaken for this order's |
| `tools/qf-read-tools/src/server.ts:25` | reads `process.env.QF_KERNEL_DB` directly and exits if absent |
| `tools/qf-peer-bus/src/bus.ts:81` | reads `process.env.QF_KERNEL_DB` directly, throws if absent |

**The agent spawn seam has two paths with opposite environment policies.** Probed for this order,
because D6 depends on it and getting it backwards would widen an attack surface:

| Spawner | Env policy | Consequence for D6 |
|---|---|---|
| `species/hermes/host-acp-client.ts:150-154` (`admitHostAcp`) | **Closed allowlist** — `PATH`, `HOME`, plus `opts.env`. Never spreads `process.env` | The key must be added **explicitly**. Do not "fix" this by spreading `process.env` — the closed list is correct and deliberate |
| `collab-electron/src/main/acp-agent.ts:178-182` | Spreads `...process.env` wholesale | Inherits the key automatically **once the app's own process has it** |
| `collab-electron/src/main/agent-host.ts:395` | Passes a **closed literal of three keys** (`HERMES_BIN`, `HOME`, `HOST_ACP_BIN`), discarding the merged `env` computed at `:380` | This is the edit point for the host-ACP path |

**Artifact bytes** are written at `agent-host.ts:629-633` to `process.env.HOME + "/.collaborator/agent-artifacts"` — global, not `COLLAB_DIR`. That is debt #29's other half and **belongs to WO-K3.** Do not move it here.

**`$HOME` is a second fork axis, and it is not the one being closed.** Probed for this order:
`paths.ts` forks on `sha256(cwd)` *and* inherits `homedir()` for its base, which is why the live
Electron process (PID 830148, started 2026-07-19, cwd `collab-electron/`) holds the
`.wo008-home` Kernel rather than the one under the real `$HOME` — same cwd hash
(`ada48d49dc49`), different `HOME`. The D1 default is `~/.quantflow/kernel.db` and therefore still
resolves through `$HOME`. **That is intentional and stays.** Overriding `HOME` is a deliberate
sandboxing act (it is how `.wo008-home` exists at all), unlike the cwd hash, which nobody chose.
D4's boot line is what makes the axis visible instead of silent. Do not attempt to defeat a `HOME`
override in this order.

---

## Deliverables

### D1 — the resolver, and it is the only one

A single exported function in `packages/qf-kernel`. It is the **sole** reader of `QF_KERNEL_DB`, and
the sole place a Kernel path is constructed from `$HOME`.

- Returns the resolved absolute path **and its provenance**, so callers can log *why* — at minimum
  distinguishing `env` from `default`. A path with no explanation is how this defect survived.
- `QF_KERNEL_DB` set and non-empty → use it, **resolved to an absolute path**, and returned as the
  real path with symlinks resolved. `:memory:` is the one exception and must keep working; `bus.ts:81`
  already documents it as a supported value.
- Otherwise → `~/.quantflow/kernel.db`. The Kernel belongs to the platform, not to the app; the app
  is a dock and a dock does not own the harbour.
- Directory creation follows RULING 3.

**"Verbatim" was wrong and the pre-build read killed it.** The first draft said to use the env value
as given. Measured:

```
cwd /dev/shm/relA , QF_KERNEL_DB=./kernel.db  ->  file containing table `a`
cwd /dev/shm/relB , QF_KERNEL_DB=./kernel.db  ->  file containing table `b`
```

Two different databases, **identical path strings**. A relative value re-forks truth on cwd — the
exact defect this order exists to remove, re-entering through the mechanism meant to fix it. Worse,
a G4 that compares resolver output as strings would go **green on a split world.** Hence: absolute,
real, always. G4 compares resolved real paths.

**Export surface.** The resolver must be reachable from `qf-kernel/portable`, not only from
`index.ts`. `collab-electron/src/main/kernel.ts:17` imports from `qf-kernel/portable`, and
`kernel-sole-writer-app` fences the app tree against other import shapes — exporting it only from
`index.ts` would make D2 unbuildable in the app without reddening a gate that is currently correct.

### D2 — every path consumer calls it

`openAppKernel` (`kernel.ts:52`) stops deriving from `COLLAB_DIR`. `server.ts:25` and `bus.ts:81`
stop reading `process.env.QF_KERNEL_DB` themselves.

**Distinguish reading from writing the variable.** Harnesses and gates that *set* `QF_KERNEL_DB` in a
child process env to point at a temp fixture are correct and must keep working —
`tools/qf-read-tools/src/harness.ts:45`, `gates/tool-discovery.ts:39`, `gates/action-transport.ts:30`,
`gates/publish-artifact-root.ts:78,235,321`, `tools/qf-peer-bus/src/harness.ts:93`. Likewise
`openKernel(explicitPath)` stays legal; the resolver answers *"what path when nobody said"*, it does
not replace the parameter.

### D3 — the pragmas, set at the one choke point

`journal_mode = WAL`, an explicit `busy_timeout`, and an explicit `synchronous`, set inside
**`attachKernel`** (`db.ts:70`).

`attachKernel` because it is the one function both drivers already pass through — `db-bun.ts`'s
`Database` and the Electron `wrapDatabaseSync` (`kernel.ts:20-47`). Setting them at the two call
sites instead creates two lists that must agree, which is the shape this whole group of orders
exists to remove.

Set them **before** the migration branch, or the create-cost measurement in RULING 2 does not apply.

**Buildability probed before this order was cut, because it was the deliverable most likely to be
impossible.** `journal_mode` returns a row, and a driver's `exec()` is not obliged to accept a
statement that returns rows. Measured 2026-07-27 on Node v24.18.0 and Bun 1.3.14:

| | `exec("PRAGMA journal_mode = WAL")` | `busy_timeout` | `synchronous` | multi-pragma in one `exec` | `:memory:` |
|---|---|---|---|---|---|
| `node:sqlite` (Electron path) | OK → `wal` | OK → `5000` | OK | OK | — |
| `bun:sqlite` | OK → `wal` | OK | OK | — | OK → reports `memory`, **does not throw** |

So D3 is buildable on both drivers, and `:memory:` degrades silently rather than throwing — which
matters, because the test suite opens `:memory:` 29 times and a throw there would redden the suite
for the wrong reason.

**`busy_timeout` is `5000` and `synchronous` is `FULL`.** Both are spelled here rather than left to
the builder, because this repo has already paid for an unnamed setting once — WO-106b's own record,
§231: *"the artifact root had no name."*

**The WAL pragma must be conditional, and this is the most important sentence in D3.** Measured
2026-07-27:

```
fresh rollback-journal file, opened { readonly: true }
  PRAGMA journal_mode = WAL   -> THROWS: attempt to write a readonly database
  PRAGMA busy_timeout = 5000  -> OK
```

WO-K1 alone never hits this, because **zero** call sites pass `readonly` today. **WO-K2's entire
deliverable is to add them.** An unconditional `journal_mode = WAL` in `attachKernel` would therefore
make every readonly open in WO-K2 die inside `attachKernel` — before any drift logic runs, which is
exactly where WO-K3's readonly carve-out is supposed to live. Setting a journal mode is a write, and
a reader must not attempt it.

So: `busy_timeout` unconditionally; `journal_mode` and `synchronous` only on a handle that can write.
**Do not defer this to WO-K2.** It is a two-line difference here and a blocked order there. This is a
cross-order composition defect caught before either order shipped — the class these rungs exist to
close, nearly recurring inside them.

**The mechanism, because round 2 correctly refused to accept the requirement without one.**
`attachKernel(db: KernelDb)` takes no options today, and `openKernel`'s `{ readonly?: true }`
(`db-bun.ts:4-14`) never reaches it. Mandating a conditional pragma without saying how the condition
is known is how a builder ends up setting WAL unconditionally anyway. Therefore:

- `attachKernel` gains an options parameter carrying a `readonly` flag, and `openKernel` passes its
  own flag through. Do not infer readonly by catching the throw — a `try`/`catch` around a pragma
  swallows real failures and cannot distinguish "reader, expected" from "the file is broken."
- The Electron `wrapDatabaseSync` path (`kernel.ts:20-47`) has no readonly option today and does not
  need one in this order; it is always a writer. Give the parameter a writable default so that call
  site is unchanged.
- The same options parameter is where `QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY` (D5) selects
  `synchronous`. **`attachKernel` reads it; nothing else does.** Round 2 flagged that D5 named the
  variable and D3 named the pragma while nothing joined them — stated here so the join is not left to
  inference.

### D4 — every process says which Kernel it opened

One greppable line at boot from every process that opens a Kernel, carrying at minimum: the resolved
absolute path, its provenance from D1, the journal mode actually in effect, and a schema fingerprint
(`schema_meta` row count is sufficient and is already the number that exposed the drift). The app
already logs a weaker version at `kernel.ts:59` — extend rather than duplicate.

### D5 — the fast test setting, fenced

Test fixtures may opt into RULING 2's relaxed row via **`QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY=1`**.
The name is spelled here, and it is deliberately too long and too alarming to appear in a shell
profile by accident. It must be reported in D4's boot line whenever it is active, and the app must
never set it. This is what turns a six-minute gate run into seconds; it is not a performance knob for
production.

### D6 — the app injects the path into **every** agent it spawns

The first draft named one edit point. The pre-build read found four more, and the correction is the
difference between "agents share a world" being true and being a comment.

**First, the app's own process must carry the resolved path** — set it in `openAppKernel`
(`kernel.ts:52`) immediately after the resolver returns, which is the one place guaranteed to run
before any agent is spawned and is already the app's single Kernel seam. The first draft claimed
`acp-agent.ts` "inherits the key automatically"; that was **false**, because nothing ever put the key
in the parent environment. Every row below depends on this one.

| Spawner | Policy | What D6 must do |
|---|---|---|
| `agent-host.ts:395` (host-ACP) | closed 3-key literal, discards the merged `env` from `:380` | add the key explicitly |
| `agent-host.ts:453-460` (AgentOS) | forwards merged `env` to `host.createSession` | ensure the merged env carries it |
| `species/hermes/agent-package/src/acp-shim.ts:70-77` | closed literal — `HERMES_BIN`, `HOME`, `PATH` | add the key explicitly, or AgentOS's work is undone one hop later |
| `collab-electron/src/main/host-native-tui.ts:102-108` | closed literal — `HERMES_BIN`, `HOST_ACP_BIN`, `HOME`, `TERM` | add the key explicitly |
| `acp-agent.ts:178-182` | spreads `...process.env` | nothing, **once the parent carries it** |

**Do not "simplify" any closed literal into a `process.env` spread.** Those allowlists are
deliberate, and widening an agent's environment to fix a path bug would trade a correctness defect
for a privilege one. Add one key.

### D8 — the pins outside the repo, and the generator that writes them

**This deliverable exists because without it the entire order is theatre.** Measured on the founder's
machine 2026-07-27 — four config files, outside any tree a gate can walk, each pinning
`QF_KERNEL_DB` to an **absolute** path that overrides the resolver by construction:

| File | Pinned to |
|---|---|
| `~/.hermes/config.yaml:176` | `~/.collaborator/dev/worktree-ada48d49dc49/kernel.db` — the app's per-worktree Kernel |
| `~/.hermes/profiles/qf-orchestrator/config.yaml:177` | `~/.qf-peer-bus/kernel.db` |
| `~/.hermes/profiles/qf-worker/config.yaml:177` | `~/.qf-peer-bus/kernel.db` |
| `~/.hermes/profiles/qf-worker-2/config.yaml:177` | `~/.qf-peer-bus/kernel.db` |

The three-way split is not a runtime guess. **It is a decision recorded on disk in four files**, and
the founder's seats were configured to disagree. Ship D1–D7 without this and every gate goes green
while every real agent seat keeps its old Kernel.

**Strip the pins; do not rewrite them.** A pinned absolute path *is* the defect — replacing one pin
with a better pin leaves the mechanism intact for the next person who edits a config. With the pin
gone, the child falls through to the resolver, which is the single answer this order exists to
create.

**`setup-founder-seats.ts:22,47-49` must stop emitting the pin**, or its next run re-creates exactly
what the migration removed. The migration and the generator are one deliverable, not two: a
documented remedy that disagrees with the thing that generates the state is the shape debt #29
already records against this codebase.

**`QF_PEER_BUS_DB` stays.** It is transport, not truth, and it is legitimately per-bus.

**`setup-founder-seats.ts` must resolve, not construct.** Round 2 found that stopping the YAML
emission at `:47-49` leaves `:22` (`KERNEL_DB = join(BUS_DIR, "kernel.db")`) and `:148`
(`openKernel(KERNEL_DB)`) intact — and that file is deliberately **not** on G1's allowlist, so the
gate reddens on it. That is not an oversight to route around with a quiet allowlist entry; it is G1
correctly catching a real second path. **Fix the file: call the resolver.** If the builder believes an
exemption is needed instead, that is a finding to report, not a line to add.

**The same generator bakes in a second kind of dead absolute path, and the seats are broken right
now.** Measured 2026-07-27 — all three seat profiles launch from a path that no longer exists:

```
~/.hermes/profiles/{qf-orchestrator,qf-worker,qf-worker-2}/config.yaml  args:
  /tmp/claude-1000/…/7336e31a-…/scratchpad/scope-w2/tools/qf-peer-bus/src/server.ts   MISSING
```

That is a scratchpad from a long-finished session. **The founder's three peer-bus seats cannot start
at all**, independently of the Kernel pin. It is the same defect shape — a generator writing a
session-local absolute path into durable config — so D8 covers both: the emitted config must carry no
path that is local to the machine state of the moment it ran. Removing the Kernel pin without this
would leave three seats that resolve the right Kernel and still fail to launch.

**One latent vector, named so it is not rediscovered.** `~/.collaborator/agentos-host-mounts.json`
carries a `speciesEnv` map that `resolveSpeciesSessionEnv` (`host-mounts.ts:103-113`) forwards
wholesale into the AgentOS merged env (`agent-host.ts:452-456`). Measured today it holds only
`HERMES_BIN`, `HOME`, `HOST_ACP_BIN` — **no Kernel pin, so there is nothing to strip.** But a pin
added there in future would reach AgentOS and *not* the host-ACP literal at `:395`, producing another
half-split. D4's boot line is the defence; no change is required in this order.

**Out-of-repo state cannot be gated**, so this deliverable is defended by D4's boot line and by G4,
never by G1. Say so in the report rather than implying coverage that cannot exist.

### D7 — the gate

A new gate, `kernel-one-path`, registered in `qa/run.ts` alongside the existing entries.

**Scope boundary, stated so it does not become a second truth:** this gate governs the repo
**outside** `collab-electron/`, exactly as `kernel-sole-writer` does; `kernel-sole-writer-app`
already fences `kernel.db` references inside `collab-electron` and keeps that job. Between them each
tree is covered once. Do not duplicate the app exemptions here.

It must go red on either of: a **read** of `process.env.QF_KERNEL_DB` outside the resolver, or the
construction of a path ending in `kernel.db` outside the resolver.

**The allowlist is spelled here, not invented by the builder.** The pre-build read found that D2 and
G1 contradicted each other — D2 requires harnesses to keep building fixture paths, G1 reddens on
exactly that — and that the builder would have resolved it by inventing an exemption list. A gate and
an unnamed exemption list that must agree, with nothing forcing them to, is **one-source-two-sides,
instance four**, created by the order written to close instance three. Allowed to construct a Kernel
path:

- the resolver module itself, and its test
- `tools/qf-read-tools/src/harness.ts`, `src/gates/tool-discovery.ts`, `src/gates/action-transport.ts`,
  `src/gates/publish-artifact-root.ts` — temp fixture databases
- `tools/qf-peer-bus/src/harness.ts` — same
- `collab-electron/`, which `kernel-sole-writer-app` already governs

Anything not on that list is an offender. **If the builder needs to add an entry, that is a finding
to report, not a line to add.**

**Stated limit, in the same terms the existing gate uses.** This is a grep, not a parser. It cannot
catch `join(dir, "kernel" + ".db")`, a path assembled at runtime, or a Kernel under a different
filename reached through the env var. `kernel-sole-writer.ts:9-10` already makes exactly this
admission about dynamically-built SQL, and **a gate that overclaims is the defect debt #28 records** —
adding a second overclaiming gate to fix the first would be absurd. G4 is what covers the shapes G1
cannot see.

---

## Acceptance gates

Every gate below is proven by bait. A gate whose red path was never observed is decoration —
`kernel-sole-writer` is in this repo's debt register (#28) for exactly that.

**G1 — single resolution, falsified.** Control: unmodified tree → green. Bait: a file that reads
`process.env.QF_KERNEL_DB`, and a second that joins a path ending in `kernel.db` → **both red**,
each naming its own offender. Remove the bait, green returns, `git status` clean.

**G2 — they take turns, with the control that makes it mean something.** Two processes hold the same
Kernel; both write; both succeed. **Control: the same test with `busy_timeout = 0` must fail.**
Without that control a green proves only that the test never contended. This mirrors control 2 in the
debt #28 review, which is the reason that review's bait was believable.

**G3 — fail closed on a bad environment variable.** `QF_KERNEL_DB` pointing into a directory that
does not exist → throws, creates nothing, and does not stall. Control: the default path on a machine
with no `~/.quantflow/` → creates and opens clean.

**G4 — one world, end to end.** The app and a spawned agent, running as separate processes, resolve
the same path; a row written by one is read by the other. **This is the property the whole order
exists for.**

Three requirements the pre-build read forced, each of which a plausible implementation would have
missed:

1. **Compare resolved real paths, not strings.** Two processes can report identical strings and hold
   different files — measured, see D1. A string comparison here goes green on a split world.
2. **Assert on a row, not on an environment variable.** Checking that the child's env carries
   `QF_KERNEL_DB` proves the injection ran, not that the world is shared. Write through one process,
   read through the other.
3. **Drive the MCP seat path, not only `agent-host` spawn.** The Hermes MCP route in D8 is the one
   that produced the live split, and it reaches the Kernel without passing through any spawn literal
   in this repo. A G4 that only exercises `agent-host.ts:395` would go green while
   `~/.hermes/profiles/*` kept three seats on the old Kernel.

   **Spelled out, because round 2 showed this requirement was not buildable as stated.** The gate
   must start `tools/qf-read-tools/src/server.ts` as a **subprocess over stdio MCP with no
   `QF_KERNEL_DB` in its environment** — that is the configuration D8 creates, and the one that must
   land on the resolver default. Assert that a row written through the app's handle is returned by a
   read tool served from that subprocess. Use the existing `StdioClientTransport` harness pattern in
   `tools/qf-read-tools/src/harness.ts` rather than inventing a second one.

   **Do not make the gate depend on the `hermes` binary being installed.** The property under test is
   "a seat-shaped MCP subprocess with no Kernel env resolves the same world," not "Hermes works."
   Binding CI to a founder-local binary would produce the false-red class debt #23 already records
   against `agent-path`.

**Corrected overclaim.** The first draft called G4 "the only gate that would have caught the original
defect." False — G1 would have reddened on `setup-founder-seats.ts`'s `join(…, "kernel.db")` and on
the direct env reads in `server.ts` and `bus.ts`, which is the tool-side half of the measured split.
G4 is necessary for the other half (wrong arithmetic inside the one file the app-scoped gate already
permits). Necessary, not sufficient, and the same is true of G1.

**G5 — no regression.** The full suite green, cold, `GATE_RUNNER_EXIT=0`. `kernel-sole-writer` and
`kernel-sole-writer-app` still pass — this order does not touch their properties, and if either moves
something is wrong.

---

## Stated ritual, not a builder's surprise

**The default path moves, so the app's current Kernel is left behind.** It holds 0 events and 0
artifacts, so nothing is lost, but the founder will see a fresh empty canvas on first launch after
this lands. Say so plainly in the report rather than letting it be discovered.

**The stale `.wo008-home` Kernel is not touched.** It holds the only history that exists and is held
open by a week-old Electron process. It is read and retired deliberately, later, on purpose.

**WAL introduces sidecar files, and the hazard is narrower than first stated.** Measured 2026-07-27:
`-wal` and `-shm` exist **while a handle is open**; after a clean close SQLite checkpoints and removes
them, leaving a single file. So a cleanly-closed Kernel still copies as one file, and **hot-copying a
live Kernel is the case that must copy all three.** Anything that backs up a Kernel needs to know
this.

## Out of scope

The artifact store's location and the orphaned bytes (WO-K3) · the gate's blindness to `openKernel`
(WO-K2) · `{ readonly: true }` on any call site (WO-K2) · `openKernel` refusing to create databases
(WO-K2) · drift detection and the empty-`schema_meta` guard (WO-K3) · a migration runner (does not
exist, and nothing here creates one) · app-local state under `COLLAB_DIR`, which is correct ·
`kernel-sole-writer-app`'s scope, re-measured 2026-07-27 and holding · widening any spawner's
environment beyond the one injected key (D6) · `QF_PEER_BUS_DB`, which is transport and correct.

## Report-back format

Per `VERIFYING.md`. In addition, this order requires:

1. The D4 boot line, verbatim, from **each** of: the app, a tool process, a spawned agent, and an
   MCP seat launched from a Hermes profile.
2. G2's control output — the failing `busy_timeout = 0` run — not only the passing run.
3. The measured create time and per-write time after D3, against RULING 2's table.
4. The four D8 config files, before and after, showing the pins removed.
5. Confirmation that `git status` is clean after every bait file is removed.

**One accepted behaviour change, recorded so it is a decision and not a discovery.**
`server.ts:25-27` today *requires* `QF_KERNEL_DB` and exits when it is absent. After D2 it resolves
the default instead, so a process with no env opens the platform Kernel rather than refusing to start.

**The log settles whether that is a loss.** `~/.hermes/logs/mcp-stderr.log` shows the `quantflow`
server failing to start four times on 2026-07-26 (15:58:56 → 15:59:04) with
`QF_KERNEL_DB env var is required`, then starting clean from 15:59:46 — which is the pin in D8 being
added. `server.ts:25-27` is a **fail-closed guard with no default**. Offering an operator no answer
leaves exactly one way forward, hardcoding an absolute path, and that is what happened four files
over. **The guard did not prevent the split; the guard caused it.** A default is what removes the
pressure to hardcode, which is why D8 strips the pins rather than correcting them.

The half that remains genuinely uncomfortable is that such a process could also **create** a Kernel.
**WO-K2 closes that** by making `openKernel` stop creating by default. Do not pull it forward, and do
not paper over it here with a second guard WO-K2 would then have to remove.
