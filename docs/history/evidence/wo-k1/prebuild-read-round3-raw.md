The last two seats fixed a lot of real holes. The four architect patches that nobody graded still leave at least one gate that can go green while the live split survives, and one deliverable that still has no buildable fix for the dead seat launchers.

## Grade of the four unreviewed fixes

| Fix | Verdict | Why |
|---|---|---|
| **(a) D3** `attachKernel` options + `readonly` + reading `QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY` | **FIXED** | `openKernel` already has the flag (`db-bun.ts:4-14`) and never passed it; options close that. Writable default leaves Electron `attachKernel(wrapDatabaseSync(raw))` unchanged. Sync env is now joined at the pragma site, not left as two sentences in different deliverables. Re-measured: readonly + `journal_mode=WAL` on a fresh DELETE file still throws; `busy_timeout` / `synchronous` do not. |
| **(b) D6** `openAppKernel` as parent-env injection site | **FIXED** | `ipc.ts:132` calls `openAppKernel()` during `registerIpcHandlers`; agents admit later. Setting `process.env.QF_KERNEL_DB` there is the only place that makes `acp-agent.ts`'s `...process.env` spread actually carry the key. Closed literals still get one explicit add — posture preserved. |
| **(c) D8** resolver in `setup-founder-seats.ts` + scratchpad `args` | **ACKNOWLEDGED** | Resolver call fixes the G1 deadlock on `:22` / `:148`. Pin strip + stop emitting `QF_KERNEL_DB` is buildable. Scratchpad `args` are only a stated property (“no path local to the machine state of the moment”) with **no mechanism**. Today `SERVER_TS = join(PKG_ROOT, "src/server.ts")` is always an absolute bake of wherever the script lives — measured shape matches the live dead paths. A builder can strip the four pins, call the resolver, leave `args` pointing at `/tmp/claude-1000/…/server.ts`, and still satisfy the written report-back (pins before/after only). |
| **(d) G4** stdio-MCP subprocess recipe | **WORSE** | Naming `server.ts` + no `hermes` binary + assert a row is right. Then: “use the existing … harness pattern in `harness.ts`.” That pattern is `envFor({ QF_KERNEL_DB: kernelDbPath, … })`, and `envFor` spreads `process.env`. Measured: after D6 the parent has the key; omitting it from overrides **still puts it in the child**. G4 goes green on injection and never exercises the D8 fall-through (no pin → resolver default) that caused the live split. |

---

## 1. Correctness bugs

**High — G4 can prove the wrong world.**  
Given: gate parent has run D6-style `process.env.QF_KERNEL_DB=…` (or any fixture pin); child built like `harness.ts` `envFor({})` with no override.  
Result: child still has `QF_KERNEL_DB`; row share proves injection, not “seat with no Kernel env lands on the same default.” D8’s post-strip configuration is untested.

**High — G4 has no shared-default recipe.**  
“No `QF_KERNEL_DB`” + “row written by app, read by MCP” only works if both resolve the same default. Measured under sandboxed `HOME`: same `HOME`, no env → shared file; different `HOME`, no env → split. The order never requires a temp `HOME` (or equivalent). Without that, a builder either (a) hits real `~/.quantflow/` during the gate, or (b) pins the app via env and “proves” a split, or (c) inherits env and hits the High above.

**High — D8 leaves seats unlaunchable after a “successful” pin strip.**  
Live profiles still have:

`args: /tmp/claude-1000/…/scratchpad/…/qf-peer-bus/src/server.ts` (MISSING)

and `QF_KERNEL_DB` pins. Removing only the Kernel lines yields: correct Kernel resolution, process exits on missing server. Same failure mode as today, minus the pin.

**Medium — SCOPES still teaches the wrong concurrency model.**  
`SCOPES.md:391-392` still says a rollback-journal writer “locks readers out entirely.” The order corrected that; SCOPES did not. A builder who reads the scope contract for “why WAL” can under-weight G2’s `busy_timeout=0` control — the load-bearing falsifier.

---

## 2. Gate assert vs code guarantee

| Gate | Risk |
|---|---|
| **G1** | Buildable. Allowlist is spelled. `setup-founder-seats` calling the resolver removes the `:22` offender. Stated grep limits are honest. Does not see `~/.hermes/` — order admits that. |
| **G2** | Buildable; control is load-bearing. Sound. |
| **G3** | Buildable; matches RULING 3. |
| **G4** | **Can be all-green while the world is still split** — inherits D6’s env via harness `envFor`, never reads Hermes YAML, never requires the no-env default path. Dead on arrival as a defence of D8. |
| **G5** | Suite green does not speak to out-of-repo pins or dead `args`. |

All five green + pins still on disk + scratchpad `args` intact = debt #28 shape again: gates pass, founder seats still wrong or dead.

---

## 3. Trust boundaries

No posture change found on:

- `execute()` as sole domain write path  
- `observe_ticket` unserved  
- `QF_ARTIFACT_ROOT` / WO-106b confinement  
- `QF_EXECUTE_ALLOWLIST` = `publish_artifact` only  
- closed spawn allowlists (D6 forbids spreading; adds one key)

**Watch items (not widenings yet):**

- D6 mutates `process.env` in the Electron main process so children can inherit the path. That is intentional for `acp-agent.ts`; it is also why G4’s harness citation is dangerous.  
- `attachKernel` reading `QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY` from the ambient env means any inherited fixture flag relaxes durability. D4 reporting is the fence; the app must not set it — inheritance is still possible. Low.  
- Artifact bytes stay at `~/.collaborator/agent-artifacts` (`agent-host.ts:629-633`). Unchanged by design.

---

## 4. Composition defects

**High — D6 × G4.**  
Each correct alone: parent must carry `QF_KERNEL_DB`; G4 must run a child with none. Together, plus `harness.ts` `envFor`, the child’s empty override still inherits the parent key. Green G4, untested D8.

**High — D8 pin-strip × dead `args` × G4-as-defence.**  
Order says out-of-repo state is defended by D4 and G4. G4 does not launch via Hermes config. Strip pins without rewriting `args` → seats still dead; G4 still green on an in-repo `server.ts` subprocess. Theatre the order was written to prevent, one turn later.

**High — WO-K1 path move × WO-K3 shelf × debt #27 wipe-and-recreate (`SCOPES.md:105`).**  
After K1, truth is `~/.quantflow/kernel.db`; bytes remain under `~/.collaborator/agent-artifacts` until K3. Wipe-and-recreate now destroys the **one** shared index while the global shelf survives — same orphan shape as #29, now on the canonical Kernel. K1 correctly stops Kernel forking (SCOPES notes that); it also opens a K1→K3 window where every new `storage_ref` points at the old shelf and will need migration or breakage when K3 moves the root. Not a reason to pull K3 forward — but the order should say the wipe ritual’s blast radius changed, not only “empty canvas on first launch.”

**Medium — WO-K1 WAL-conditional × WO-K2 readonly (already caught, mechanism now FIXED).**  
D3’s options parameter closes the landmine round 2 graded ACKNOWLEDGED. Hold the line: do not defer the conditional.

**Medium — G4 tests `qf-read-tools`, while three of four live pins feed `qf-peer-bus`.**  
After D2 both should call the resolver, so one no-env MCP is enough **if** G4 actually runs with no env. Today it may not (see D6×G4).

---

## What is sound

One resolver, absolute real paths, RULING 1 (single env mechanism), RULING 3 (fail closed on bad env parent), WAL + `busy_timeout=5000` + `synchronous=FULL` at `attachKernel`, G2’s zero-timeout control, D6’s full spawn table without widening allowlists, and refusing to pull WO-K2 create-refusal forward.

---

**DO NOT BUILD** — before cut: (1) G4 must sandbox `HOME` (or equivalent), **delete** `QF_KERNEL_DB` from the child env, assert a row, and cite `StdioClientTransport` only — not `harness.ts` `makeClient`/`envFor`; (2) D8 must name a concrete `args` rewrite (re-run generator from the real tree is enough only if report-back shows `args` before/after, not only pins); (3) fix or footnote `SCOPES.md:391-392` so it matches corrected RULING 2.
