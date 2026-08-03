## JOB 1 — Round-1 fix verification

| Finding | Verdict | Why |
|---|---|---|
| **A1** — four `~/.hermes` pins outside repo | **FIXED** | D8 names all four files, mandates strip-not-rewrite, pairs with `setup-founder-seats.ts` generator fix, and states D4/G4 as the only durable defense. Builder can execute this. |
| **High 2** — D6 incomplete (5 spawners + parent env) | **FIXED** | D6 now lists all five spawners with file:line, forbids `process.env` spread widening, and requires the main process carry the key before `acp-agent.ts` inheritance works. |
| **High 3** — G1 vs D2 contradict | **ACKNOWLEDGED** | Named allowlist resolves the harness contradiction, but `tools/qf-peer-bus/scripts/setup-founder-seats.ts:22` still constructs `kernel.db` and is **not** on the allowlist; the order notes G1 would redden it but does not say to replace `KERNEL_DB` with the resolver or grant a bounded exemption. |
| **High 4** — relative `QF_KERNEL_DB` splits world | **FIXED** | D1 requires absolute realpath; G4 requirement 1 requires realpath comparison. Executable. |
| **High 5** — unnamed `busy_timeout` and D5 env var | **FIXED** | D3 spells `busy_timeout = 5000`, `synchronous = FULL`; D5 spells `QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY=1`. |
| **RULING 2 correction** — WAL vs `busy_timeout` roles | **FIXED** | Re-measured in `/dev/shm`: `DELETE`/`WAL` with `busy_timeout=0` → second writer **FAIL 1ms**; with `busy_timeout=2000` → **OK ~530ms**. WAL does not rescue writer–writer. Matches corrected order. |
| **readonly + WAL landmine** | **ACKNOWLEDGED** | Order requires conditional `journal_mode`/`synchronous`, and re-measured: readonly + `PRAGMA journal_mode=WAL` **throws** on both bun and node drivers; `busy_timeout` OK. But `attachKernel(db)` has no readonly signal — builder must invent detection/plumbing. |
| **G4 overclaim** | **FIXED** | G4 now says necessary not sufficient; G1 would have caught tool-side reads and `setup-founder-seats` join. |

---

## JOB 2 — New / rewritten material

### High

**1. D3 does not say how to know a handle is writable**  
`attachKernel` takes only `KernelDb`; `openKernel` has `{ readonly?: true }` in `db-bun.ts:4-14` but that flag never reaches `attachKernel`. Electron's `wrapDatabaseSync` path has no readonly option today. The order mandates the conditional pragma but not the mechanism (`attachKernel(db, opts?)`, try/catch, `PRAGMA query_only`, etc.). A builder who sets WAL unconditionally ships a WO-K2 breaker.

**2. G4 requirement 3 is not buildable as written**  
"Drive the MCP seat path" and report-back item 1 (Hermes profile boot line) are stated, but there is no gate file, subprocess recipe (`hermes -p …`), fixture profile, or CI guard against `hermes` absence. A builder can satisfy G4 with app + `agent-host` spawn only and never exercise the Hermes YAML route that caused the live split.

**3. D8 + G1 leave `setup-founder-seats.ts` in a deadlock**  
D8 stops YAML emission at `:47-49`, but `:22` (`KERNEL_DB = join(BUS_DIR, "kernel.db")`) remains and `:148` still calls `openKernel(KERNEL_DB)`. That file is not on the G1 allowlist. The order says G1 *would* redden this path (line 400) without instructing the builder to call the resolver for bus init. Likely outcomes: stealth allowlist entry (forbidden) or a red gate the order did not plan for.

### Medium

**4. D6 parent-env injection site is unspecified**  
"Set it in the main process once the resolver has run" — discoverable (`openAppKernel()` is called from `ipc.ts:132`), but not named. Low risk of wrong seam; still ambiguous for a strict builder.

**5. Fifth config surface: `~/.collaborator/agentos-host-mounts.json`**  
Measured: no `QF_KERNEL_DB` today. But `resolveSpeciesSessionEnv` (`host-mounts.ts:103-113`) forwards arbitrary `speciesEnv` keys into AgentOS's merged env (`agent-host.ts:452-456`). Not in D8's four-file table. A future or founder-local pin there would reach AgentOS but not the host-ACP literal at `:395` or Hermes MCP YAML — another silent half-split vector.

**6. D5 → D3 wiring for `synchronous` is implied, not in D3**  
D5 names the fast-fixture env var; D3 mandates `synchronous = FULL` but never says `attachKernel` reads `QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY`. Builder must infer the connection.

**7. D8 line numbers verified with one nit**  
All four pins confirmed at measured paths: `~/.hermes/config.yaml:176`, three profiles at `:177`. "Strip the pin" is correct post-D2: with no env, `server.ts`/`bus.ts` will resolve the default. `QF_PEER_BUS_DB` legitimately stays. **No fifth live `QF_KERNEL_DB` pin found** in `.mcp.json`, shell rc, `.profile`, Cursor config, or systemd — **UNVERIFIED** on every possible machine, but on this founder machine only the four Hermes YAMLs carry it.

### Low

**8. Reader blip during commit — UNVERIFIED this seat**  
Parallel probe (`/dev/shm`, 800ms tight readonly loop during `BEGIN IMMEDIATE` commit): `DELETE` and `WAL` both reported `locked: 0`. Round-1's `721 ok / 1 locked` blip was not reproduced here; the corrected RULING 2 narrative (readers not blocked for the whole write; WAL removes the brief blip) still holds on writer–writer evidence and does not change the shipping requirement.

**9. `~/.hermes` profile MCP `args` still point at a stale scratchpad `server.ts`**  
Measured in all three seat profiles. Separate from the Kernel pin; D8 does not address it. Seat MCP may fail even after pin removal.

---

**Verdict: DO NOT CUT**

Shortest path to cuttable:
1. **D3** — Plumb `{ readonly?: boolean }` from `openKernel` (and future Electron readonly) into `attachKernel`; skip `journal_mode`/`synchronous` when readonly; state that explicitly.
2. **G4** — Name the MCP-seat subprocess (profile, command, row assertion) in the gate spec or a `qa/gates/` file.
3. **D8 / setup-founder-seats** — Require `setup-founder-seats.ts` to call the resolver for bus Kernel init (not `join(…, "kernel.db")`), or add a single bounded G1 exemption with rationale.
4. **D3 / D5** — One sentence: `attachKernel` reads `QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY` to choose `synchronous`.The two background probes hung (likely on overlapping `bun` child processes), so they were killed.

Follow-up probes in `/dev/shm` already produced the numbers used in the round-2 read:

- **Writer–writer:** `busy_timeout=0` → immediate `database is locked` (DELETE and WAL); `busy_timeout=2000` → OK ~530ms. Confirms the corrected RULING 2.
- **Reader-during-commit:** the tight-loop rerun got `locked: 0` for both modes — the round-1 blip count wasn’t reproduced here, but that doesn’t change the verdict.

No further action needed on those probes.
