# WO-K1 adversarial read — findings

## High (one line each)

1. **D6 is the wrong seam for half the original defect** — `setup-founder-seats.ts` hardcodes `~/.qf-peer-bus/kernel.db` into Hermes MCP YAML; spawn-env injection at `:395` never reaches that child.
2. **D6 names one edit point; three other closed allowlists still strip `QF_KERNEL_DB`** — AgentOS→`acp-shim.ts`, `host-native-tui.ts`, and the discarded merge at `:380`.
3. **G1 vs D2 contradict** — harnesses must keep `join(workDir, "kernel.db")`, but G1 goes red on any such construction; no allowlist is named (fourth one-source-two-sides).
4. **D1 “use env verbatim” accepts relative paths** — same string, different cwd ⇒ different files; G4 string-equality can go green on a split world.
5. **`busy_timeout` value and D5 env-var name are unnamed** — builder invents both; wrong guesses recreate intermittent lock failures or a silent production footgun.

---

## 1. RULING 2 — overstated on readers, right on shipping both, wrong on which knob saves writers

**Measured** (`/dev/shm`, bun:sqlite, two processes):

| Case | Second writer while first holds `BEGIN IMMEDIATE` |
|---|---|
| DELETE, `busy_timeout=0` | fail immediate |
| WAL, `busy_timeout=0` | fail immediate |
| DELETE, `busy_timeout=2000`, hold 200ms then commit | success (~229ms) |
| WAL, `busy_timeout=2000`, hold 200ms then commit | success (~229ms) |

| Readers during writer commit | |
|---|---|
| DELETE, busy=0 | 721 ok / **1** `database is locked` |
| WAL, busy=0 | 724 ok / **0** fails |

**Verdict:** Shipping path-unification without concurrency settings does create a liveness defect — **correct**. But:

- **Writer–writer:** `busy_timeout` does the real work. **WAL alone does not.** The order’s narrative leans on WAL for “they take turns”; G2’s control (`busy_timeout=0` must fail) is the load-bearing one and is right.
- **“Writer locks readers out entirely” under rollback** — **overstated**. Readers mostly proceed under `BEGIN IMMEDIATE`; they only blip during the exclusive phase of commit. WAL removes that blip; it is not “readers blocked for the whole write.”
- **WAL makes worse:** hot-copy of `-wal`/`-shm` (order already says this). Also: a hung holder + large `busy_timeout` turns instant “locked” into multi-second stalls that look like hangs (**Medium** diagnostic cost). Network FS not applicable here.

**Cost if shipped as written:** builder may treat WAL as sufficient and under-specify or under-test `busy_timeout`; intermittent writer failures survive.

---

## 2. D1/D2 — resolver is not actually single after the named edits

After D2 as written, remaining alternate worlds:

| Path | Status |
|---|---|
| `openAppKernel` / `server.ts` / `bus.ts` | Named; would be fixed |
| **`tools/qf-peer-bus/scripts/setup-founder-seats.ts`** | `KERNEL_DB = join(HOME, ".qf-peer-bus", "kernel.db")` written into MCP `env:` — **not named in D2/D6**. MCP children open that path even if the app uses the resolver. **This is how the peer-bus half of the live three-Kernel split was created.** |
| Harnesses `join(workDir, "kernel.db")` + set env | Explicit fixtures; OK if intentional |
| `openKernel(explicitPath)` / `:memory:` | Order correctly keeps these |
| Bundled `out/`, `node_modules` copies | Gate skips `out/`/`node_modules` (same as sole-writer). Stale bundled path arithmetic would be invisible to G1 — **UNVERIFIED** whether current Electron build embeds a Kernel path string |
| Production `COLLAB_DIR` (non-DEV = `~/.collaborator`) | Becomes irrelevant for Kernel only if `openAppKernel` actually switches; order says it does |
| App never sets `process.env.QF_KERNEL_DB` | `acp-agent.ts` “inherits once the app has it” is **false under D6 as written** — D6 only adds the key to the host-ACP literal, not to the parent env |

**Cost:** order can pass G1/G4-as-spawn-env-check while founder seats still talk to `~/.qf-peer-bus/kernel.db`. Same class of silent split the order exists to kill.

---

## 3. D3 — pragmas in `attachKernel`: works for today’s drivers (writable); readonly is a landmine

**Measured:**

- **bun:sqlite** and **node:sqlite `DatabaseSync`**: `exec("PRAGMA journal_mode = WAL")`, `busy_timeout`, `synchronous` all succeed on writable handles. `journal_mode` returning a row does **not** break Electron `wrapDatabaseSync` → `raw.exec()`. **Order is right here.**
- **`:memory:`:** `journal_mode = WAL` does not throw; effective mode stays `memory`. **Order is right.**
- **Readonly + fresh DELETE-mode file:** both drivers — `PRAGMA journal_mode = WAL` → **`attempt to write a readonly database`**. `busy_timeout` still works. Today zero file-backed sites pass `{ readonly: true }` (WO-K2), so WO-K1 won’t hit this — but putting WAL unconditionally in `attachKernel` **poisons WO-K2** unless K2 learns to skip/catch it.

**Cost if ignored:** K2 readonly open of a non-WAL file dies inside `attachKernel` before any drift logic runs.

---

## 4. D6 — spawn-seam table is incomplete; `:395` is not enough

**Verified:** two opposite policies exist as claimed:

- `host-acp-client.ts:150-154` — closed allowlist (`PATH`, `HOME`, `...opts.env`)
- `acp-agent.ts:178-182` — spreads `process.env`

**Also verified — order misses:**

| Spawner | Policy | Gets D6 injection? |
|---|---|---|
| `agent-host.ts:395` host_acp | Closed 3-key literal (discards merged `env` at `:380`) | Only if edited |
| `admitAgentOsSpecies` `:453-460` | Passes merged env to AgentOS | Not named |
| **`species/hermes/agent-package/src/acp-shim.ts:70-77`** | Closed `HERMES_BIN`/`HOME`/`PATH` only | **Strips `QF_KERNEL_DB` even if AgentOS had it** |
| `host-native-tui.ts:103-108` | Closed literal, no Kernel key | Not named |
| Hermes MCP via `setup-founder-seats` YAML | Explicit `QF_KERNEL_DB: ~/.qf-peer-bus/kernel.db` | **Independent of all of the above** |

SCOPES says inject into **every** agent process; D6 narrows to one line. That narrowing is a defect.

**Cost:** “agents share a world” ships as a comment while AgentOS, TUI, and peer-bus MCP keep private or empty Kernel config.

---

## 5. D7/G1 — baits the gate would miss (most valuable)

Designs that keep a **different Kernel path** while G1 stays green (as specified: env **read** outside resolver, or path construction ending in `kernel.db`):

1. **Relative env (defeats G4 too if it compares resolver strings)**  
   `QF_KERNEL_DB=./kernel.db` — D1 says use verbatim. Measured: cwd `a` vs `b` → two real files, identical path strings. No `kernel.db` construction outside resolver; no illicit `process.env` read if children only call the resolver.

2. **MCP / out-of-tree config**  
   Leave `~/.hermes/.../config.yaml` pointing at `~/.qf-peer-bus/kernel.db`. G1 only greps the repo. Original defect’s peer-bus half survives with a green gate.

3. **Obfuscated construction** (same class as `observe-door` string-concat limit)  
   `join(dir, "kernel" + ".db")`, `join(dir, ["kernel","db"].join("."))`, `` `${dir}/kernel.${"db"}` `` — greps for `kernel.db` as a literal miss.

4. **Different filename, same isolation**  
   `~/.quantflow/truth.sqlite` via env — no `kernel.db` token; still a private world vs default.

5. **`openKernel("/absolute/…/kernel.db")` in a file G1 exempts**, or only inside `collab-electron/` (D7 explicitly defers app tree to `kernel-sole-writer-app`, which **allows** `kernel.db` in `kernel.ts`) — app can keep deriving a path inside the one allowed file and G1 never sees it.

6. **Harness exemption creep** — to make D2’s fixtures pass, builder will invent an allowlist. Anything on that list can construct a second path; gate and allowlist become two artifacts that must agree with nothing forcing them to (see High #3).

**Recommended order fix (not implementing):** G1 must force absolute resolved paths; G4 must compare `realpath` and must exercise the **MCP/peer-bus** path that held the live split, not only `agent-host` spawn env.

---

## 6. G4 — “only gate that would have caught the original defect” is overstated

**Partly right:** neither G1 nor `kernel-sole-writer-app` can catch “wrong arithmetic inside the one allowed file” (`kernel.ts` joining `COLLAB_DIR`). Runtime shared-world proof is necessary for that half.

**Wrong as stated:** G1 *would* have gone red on `setup-founder-seats.ts`’s `join(..., "kernel.db")` and on direct `process.env.QF_KERNEL_DB` reads in `server.ts` / `bus.ts` — i.e. the tool-side half of the measured three-file split. So G4 is not the only gate that would have caught “the original defect.”

**Cost:** false confidence that G1 is merely decorative; under-investment in G1’s allowlist and in what G4 actually drives.

---

## 7. Builder must guess (each with likely guess + safety)

| Gap | Likely guess | Safe? |
|---|---|---|
| `busy_timeout` ms | `5000` | Mostly; too low → intermittent G2 flakes under load |
| `synchronous` in D3 | `FULL` (from RULING 2 table) | Yes — if they read the table; D3 text alone is silent |
| D5 env var name | `QF_KERNEL_UNSAFE_SYNC_NORMAL` or similar | Unsafe if vague (`QF_FAST=1`) and leaks into app |
| Export resolver on `qf-kernel/portable` | May only export from `index.ts` | **Unsafe** — Electron imports `portable` only; `kernel-sole-writer-app` blocks other imports |
| G1 allowlist for harnesses / comments / `setup-founder-seats` | Copy sole-writer style exemptions | **Unsafe** — unnamed second list; comments in `register.ts` mentioning `kernel.db` may false-red |
| `server.ts` with env unset | Call resolver → open `~/.quantflow/kernel.db` | **Behavior change:** today exits; after, opens (and may create) the real platform Kernel from a forgotten CI env |
| How G4 “spawned agent resolves” | Check child env for `QF_KERNEL_DB` | **Misses MCP YAML path**; looks green, world still split |
| Whether to update founder Hermes configs | Ignore (out of tree) | **Unsafe** — live split survives |
| WAL on readonly in `attachKernel` | Set unconditionally | Breaks WO-K2 later |

---

## What the order got right (briefly)

- Path unification without lock wait is a real hazard; G2’s `busy_timeout=0` control is the correct falsifier for turn-taking.
- `attachKernel` as the pragma choke point works on both current writable drivers; `:memory:` does not throw.
- Spawn-seam table’s two cited paths (`host-acp-client` closed vs `acp-agent` spread) are accurate as far as they go.
- RULING 1 (one mechanism = `QF_KERNEL_DB`) and RULING 3 (default may mkdir parent; env must not) are coherent and match measured `SQLITE_CANTOPEN` asymmetry.
- `getKernelPath()` has zero callers; name `getKernelDbPath()` does not exist — fact table is right.

---

## Severity summary

| Sev | Count | If shipped unfixed |
|---|---|---|
| High | 5 | Silent multi-Kernel split survives behind green gates; or G1/D2 deadlock forces a homemade allowlist that reopens the hole |
| Medium | RULING 2 reader overclaim; G4 “only gate” overclaim; readonly+WAL landmine; tool-server fail-open to real Kernel | Wrong mental model; K2 breakage; accidental writes to platform DB |
| Low | WAL checkpoint/`busy_timeout` hang UX; comment false-positives in G1 | Noise and misdiagnosis |

**Bottom line:** Do not cut. The order still has the failure mode that killed its predecessor — a gate that can be green while two processes disagree about which file is truth — plus a D6 that never touches the MCP config path that created the live peer-bus Kernel.
