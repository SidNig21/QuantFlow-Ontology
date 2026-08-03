# WO-K3 — build report

> **In plain terms:** new research files now land next to the ledger under
> `~/.quantflow/`, and an obsolete or half-built database refuses writes (and
> warns on read-only tools) instead of quietly accepting a lie.

| | |
|---|---|
| Branch | `wo-k3` off `main` @ `9de0249` |
| Builder | Cursor seat (`composer-2.5` / standing constraint) |
| Status | **awaiting independent verification** |
| Closes | debt #27 (registry drift silent) · debt #29 bytes half |

## D1 — artifact root

- `resolveArtifactRoot()` — env fail-closed; default `~/.quantflow/artifacts/`
- `openAppKernel` injects `QF_ARTIFACT_ROOT`; spawn paths (agent-host ACP/AgentOS,
  host-native-tui, hermes acp-shim) forward it
- `agent-host` publish uses `getArtifactRoot()` — no `.collaborator/agent-artifacts`
  in the production publish path (comment-stripped grep in `artifact-root` gate)

**Legacy bytes (not migrated this rung):** platform Kernel has **0** artifact rows.
Pre-rebuild backup has **5/5** rows pointing at collaborator paths; **2** files still
on `~/.collaborator/agent-artifacts/`. New publishes only go under the resolved root.

## G1 mutant matrix (prior declared: artifact, agent_session, run)

| Mutant | Class |
|---|---|
| drop `run` table | inconsistent |
| delete `artifact` meta row | missing |
| orphan `orphan_probe` table | inconsistent |
| truncate object meta | missing |
| canary-only `schema_meta` | missing / inconsistent |

Fixture strategy **A**: `qa/fixtures/kernel-drift/prior-schema/` (pinned schema +
migration — not live `golden/migration.sql`).

## G2 / G3 transcripts

Package tests (`bun test src/attach-kernel-drift.test.ts`):

```
canary-only schema_meta writable → KernelIncompleteInitializationError
canary-only schema_meta readonly → warn + getKernelDrift
clean :memory: writable publish succeeds
prior-schema fixture writable → KernelRegistryDriftError
prior-schema fixture readonly → warn + getKernelDrift
5 pass
```

Full: `docs/orders/evidence/wo-k3/attach-kernel-drift.txt`.

## G5 — WO-106b six shapes (relocated)

`publish-artifact-root` under `HOME/.quantflow/artifacts` (quantflow-shaped temp):
**PASS** (`PAR:0`). Absolute outside, `..` traversal, symlink escape, prefix sibling
reject; inside-root accept; fail-closed without root.

## G6 coupling bait

Remove `enforceObjectTypeRegistryDrift` call from `attachKernel` →

```
kernel-drift FAIL: attachKernel must call enforceObjectTypeRegistryDrift()
G6_BREAK_EXIT=1
→ restore → PASS  G6_RESTORE_EXIT=0
```

`QF_KERNEL_DRIFT_ENFORCE_OFF=1` → gate fails at end (expected red) → restore green.
Transcripts: `bait-g6-coupling.txt`, `bait-g2-enforce.txt`.

## Allowlist additions (reported)

| List | Path | Why |
|---|---|---|
| DRIVER_SQL | `qa/fixtures/kernel-drift/` | pinned prior + canary SQL |
| DRIVER_SQL | `qa/gates/kernel-drift/run.ts` | mutant DDL |
| OPEN / WRITE | `qa/gates/kernel-drift/run.ts` | openKernel + control publish |
| OPEN / WRITE | `qa/gates/artifact-root/run.ts` | D5 publish proof |

`kernel-one-path`: no new entries (gates avoid illicit `kernel.db` literals).
`PRODUCTION_NO_CREATE`: none.

## Builder gates run

```
packages/qf-kernel bun test     → 60 pass
bun qa/run.ts kernel-drift      → PASS
bun qa/run.ts artifact-root     → PASS
bun qa/run.ts kernel-sole-writer → PASS
bun qa/run.ts kernel-one-path   → PASS
bun qa/run.ts publish-artifact-root → PASS
```

Cold `bun qa/run.ts --all` deferred to verifier (PROTOCOL).

## Judgment

- Drift detector treats non-infra tables without meta claims as inconsistent so the
  orphan-table mutant is visible; `events`/`links`/`schema_meta` stay exempt.
- Incomplete init (canary) is a separate throw from registry drift — wipe-and-recreate,
  no in-place repair.
- Coupling check strips comments so commenting out the call is not a free pass.
