# WO-K1 — pre-build adversarial read, 2026-07-27

**Third seat:** `cursor-grok-4.5-high`, decorrelated — did not write the order and will not build it.
**Command:** `cursor-agent --print --output-format text --model cursor-grok-4.5-high --trust --sandbox enabled "$(cat …/prebuild-k1.md)"`
**Raw report:** [`prebuild-read-raw.md`](prebuild-read-raw.md), 160 lines, recovered from stdout
directly (11,532 bytes — no store.db recovery needed this time, unlike the post-merge review).
**Tree after:** clean. The seat wrote nothing inside the repo.

**Verdict: DO NOT CUT.** Accepted. The order carried the same failure mode that killed its
predecessor — a gate that can be green while two processes disagree about which file is truth.

## How this record is organised

The third seat produced 5 High findings. The architect seat re-measured each one before accepting
it; **an unverified finding is not a finding.** Where re-measurement changed the shape, the sharper
version is recorded and the disagreement is stated. One finding below (**A1**) was found by the
architect *while verifying* the seat's High #1, is materially worse than what the seat reported, and
is the single most important thing on this page.

---

## A1 — THE LIVE SPLIT IS WRITTEN DOWN IN FOUR CONFIG FILES OUTSIDE THE REPO · **CRITICAL** · MEASURED

The third seat reported that `setup-founder-seats.ts` bakes `~/.qf-peer-bus/kernel.db` into Hermes
MCP YAML, so spawn-env injection at `agent-host.ts:395` can never reach that child. Correct, and
**it understates the situation.** Measured on the founder's machine 2026-07-27:

| File | `QF_KERNEL_DB` pinned to |
|---|---|
| `~/.hermes/config.yaml:176` | `/home/sidnig21/.collaborator/dev/worktree-ada48d49dc49/kernel.db` — **the app's per-worktree Kernel** |
| `~/.hermes/profiles/qf-orchestrator/config.yaml:177` | `/home/sidnig21/.qf-peer-bus/kernel.db` |
| `~/.hermes/profiles/qf-worker/config.yaml:177` | `/home/sidnig21/.qf-peer-bus/kernel.db` |
| `~/.hermes/profiles/qf-worker-2/config.yaml:177` | `/home/sidnig21/.qf-peer-bus/kernel.db` |

**This is the mechanism of the three-way split, and it is not a guess made at runtime — it is a
decision recorded on disk, in four files, outside any tree a gate can walk.** The default Hermes
profile points the read-tool server at the app's Kernel. The three seat profiles point at the
peer-bus Kernel. They were configured to disagree.

**Why this is worse than "no gate covers it."** All four pins are **absolute paths**, so they
override the resolver default by construction. WO-K1 as originally written would move the default to
`~/.quantflow/kernel.db`, pass every one of its own gates, and **change nothing for any real agent
seat the founder actually uses.** The order would report success against a split that survived it
intact.

**Consequences accepted into the order:**

1. A deliverable that strips the pins rather than rewriting them — a pinned absolute path is the
   defect, and replacing one pin with a better pin leaves the mechanism in place.
2. `setup-founder-seats.ts` must stop emitting the pin at generation time, or the next run of it
   re-creates what the migration just removed. **That pairing is the whole finding**: a one-time
   migration without a generator fix is the documented-remedy-disagrees-with-the-layout shape that
   debt #29 already records.
3. `QF_PEER_BUS_DB` **stays.** It is transport, not truth, and it is legitimately per-bus.
4. Boot logging (D4) is the only durable defence, because no repo gate can see `~/.hermes/`.

---

## Findings from the third seat, with re-measurement

### High 1 — D6 is the wrong seam for half the defect · **ACCEPTED, sharpened** → see A1

### High 2 — three further closed env allowlists strip the key · **ACCEPTED** · re-measured

Verified by reading each site:

| Spawner | Env policy | Reaches the child? |
|---|---|---|
| `agent-host.ts:395` (host-ACP) | closed literal, 3 keys; discards the merged `env` built at `:380` | only if edited |
| `agent-host.ts:453-460` (AgentOS) | passes merged `env` to `host.createSession` | would carry the key, but nothing puts it there |
| `species/hermes/agent-package/src/acp-shim.ts:70-77` | closed literal — `HERMES_BIN`, `HOME`, `PATH` | **strips it even if AgentOS had it** |
| `collab-electron/src/main/host-native-tui.ts:102-108` | closed literal — `HERMES_BIN`, `HOST_ACP_BIN`, `HOME`, `TERM` | no |
| `acp-agent.ts:178-182` | spreads `...process.env` | yes — **but only once the app's own process has the key, which D6 as written never arranged** |

The seat's catch on the last row is the sharp one: the order claimed `acp-agent.ts` "inherits the key
automatically," which is **false** under D6 as written, because D6 only added the key to a spawn
literal and never to the parent's own environment.

### High 3 — G1 and D2 contradict each other · **ACCEPTED**

D2 requires harnesses to keep constructing fixture paths (`join(workDir, "kernel.db")`); G1 goes red
on any construction of a path ending in `kernel.db`. The order named no allowlist, so the builder
would have invented one — producing a gate and an exemption list that must agree with nothing forcing
them to. **That is one-source-two-sides, instance four**, and it would have been created by the order
written to close instance three.

### High 4 — a relative `QF_KERNEL_DB` splits the world while every string matches · **ACCEPTED** · re-measured

RULING 1 said "use it verbatim." Measured directly:

```
cwd /dev/shm/relA , QF_KERNEL_DB=./kernel.db  -> file containing table `a`
cwd /dev/shm/relB , QF_KERNEL_DB=./kernel.db  -> file containing table `b`
```

Two different databases, identical path strings. A G4 that compares resolver output as strings goes
**green on a split world.** Fix accepted: the resolver returns an absolute real path, and G4 compares
resolved real paths, not strings.

### High 5 — the timeout value and the fast-fixture env var have no names · **ACCEPTED**

This repo has paid for an unnamed env var before: WO-106b's own record, §231, reads *"the artifact
root had no name."* Leaving `busy_timeout`'s value and D5's variable name to the builder repeats a
defect the register already carries. Both are now spelled in the order.

### Finding 1 detail — RULING 2 was overstated, and the correction matters · **ACCEPTED**

The seat's measurement, two processes on `/dev/shm`:

| Case | Second writer, first holding `BEGIN IMMEDIATE` |
|---|---|
| rollback journal, `busy_timeout=0` | fails immediately |
| **WAL, `busy_timeout=0`** | **fails immediately** |
| rollback journal, `busy_timeout=2000` | succeeds (~229 ms) |
| WAL, `busy_timeout=2000` | succeeds (~229 ms) |

| Readers during a writer's commit | |
|---|---|
| rollback journal, `busy_timeout=0` | 721 ok / **1** locked |
| WAL, `busy_timeout=0` | 724 ok / **0** locked |

**The order's conclusion survives; its stated reason does not.** RULING 2 claimed "under a rollback
journal a writer locks readers out entirely." That is **wrong** — readers proceed for the whole
`BEGIN IMMEDIATE` window and only blip during the brief exclusive phase of commit. And for
writer-versus-writer, **`busy_timeout` does the real work; WAL alone changes nothing.**

Why this correction is not cosmetic: an order that leans on WAL for "they take turns" invites a
builder to ship WAL, watch the speed improve, and under-test the timeout. G2's control — the same
test at `busy_timeout = 0` must fail — was already the right falsifier and is now the load-bearing
one.

**One hazard the seat added, accepted as a Low:** a hung holder plus a large `busy_timeout` converts
an instant, legible `database is locked` into a multi-second stall that reads as a hang.

### Finding 3 — WAL on a readonly handle throws, and it poisons WO-K2 · **ACCEPTED** · re-measured

```
fresh DELETE-mode file, opened { readonly: true }
  PRAGMA journal_mode = WAL   -> THROWS: attempt to write a readonly database
  PRAGMA busy_timeout = 5000  -> OK
```

WO-K1 alone would never hit this, because zero call sites pass `readonly` today. **WO-K2's entire
deliverable is to add them.** An unconditional WAL pragma in `attachKernel` would therefore make
every readonly open in WO-K2 die inside `attachKernel`, before any drift logic could run — which is
also precisely where WO-K3's readonly carve-out is supposed to live.

**This is a cross-order composition defect, caught before either order shipped.** It is the class the
identity rungs exist to close, and it nearly recurred inside them.

### Finding 6 — G4's "only gate that would have caught it" was an overclaim · **ACCEPTED**

G1 *would* have gone red on `setup-founder-seats.ts`'s `join(…, "kernel.db")` and on the direct
`process.env.QF_KERNEL_DB` reads in `server.ts` and `bus.ts` — the tool-side half of the split. G4 is
necessary for the other half (wrong arithmetic inside the one file the app-scoped gate already
allows), not sufficient for both. Corrected in the order.

### Finding 5 — baits the gate would miss · **ACCEPTED in part**

Accepted and now addressed: relative paths (High 4), out-of-tree MCP config (A1), a different
filename via env, and harness-exemption creep (High 3).

**Partly declined:** obfuscated construction — `join(dir, "kernel" + ".db")`,
`` `${dir}/kernel.${"db"}` ``. This is real, and it is the *documented and accepted* limit of a
grep-based gate: `kernel-sole-writer.ts:9-10` already states "it is a grep, not a parser — it cannot
catch dynamically-built SQL, and does not claim to." The order now states the same limit in the same
terms rather than pretending to a coverage it does not have. A gate that overclaims is the defect
debt #28 records; adding a second overclaiming gate to fix the first would be absurd.

---

## What the read confirmed as sound

- `attachKernel` is the correct pragma choke point for both **writable** drivers; `:memory:` reports
  `memory` and does not throw. (Independently measured by the architect seat before the read ran.)
- RULING 1 — one isolation mechanism (`QF_KERNEL_DB`), not two — is coherent.
- RULING 3 — the default may create its parent, the env var may not — matches the measured
  `SQLITE_CANTOPEN` asymmetry.
- The fact table is accurate, including that `getKernelDbPath()` does not exist and the real function
  is `getKernelPath()` with zero callers.
- The two spawn paths the order did cite are accurately characterised, as far as they go.

## Process notes

- The seat's stdout arrived complete (11,532 bytes). The `store.db` recovery route recorded in the
  post-merge review was not needed. Recorded because two of the last three runs *did* need it.
- One self-inflicted error by the architect seat: a verification probe for High 4 was run with a
  relative path from the repo root and wrote a stray `kernel.db` into the working tree. Caught
  immediately, removed, `git status` verified clean. Noted because it is a small live instance of
  exactly what High 4 describes — a relative path resolving somewhere its author did not intend.
