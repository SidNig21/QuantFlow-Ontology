# WO-N1 — builder evidence · 2026-07-30

**In plain terms:** The shipped app now identifies itself as QuantFlow and copies the founder's
existing app, browser, and workspace state into QuantFlow's folders before anything can overwrite
it.

**Candidate branch:** `codex/wo-n1`

**Implementation commit:** `9a0b63f`

**Cold integration repair:** `a710786`

**Electron migration repair:** `b3cbc1f`

This is builder evidence, not a shipping verdict. A separate cold verifier decides PASS or REWORK.

## Implementation

- Packaging now pins `QuantFlow`, `com.quantflow.ontology`, `@quantflow/electron`, Linux executable
  `quantflow`, canvas command `qf-canvas`, and GitHub release target
  `SidNig21/QuantFlow-Ontology`.
- `QF_APP_ROOT` is `~/.quantflow/app`; development launches use
  `QF_APP_DIR=~/.quantflow/app/dev/worktree-<id>`. Kernel truth remains
  `~/.quantflow/kernel.db` and artifact bytes remain `~/.quantflow/artifacts/`.
- Global app state and Electron `userData` cross one sibling-stage/atomic-rename boundary before
  logger, config, sidecar, or browser consumers start. The source is never moved or deleted;
  symlinks, Kernel/artifact bytes, PID/socket files, and generated breadcrumbs are excluded; a copy
  failure removes only its stage and remains retryable.
- Workspace-local `.collaborator/` compatibility state migrates to `.quantflow/` before configured
  workspace boot, workspace add, config, thumbnail, or replay consumers. Existing legacy ignore
  lines remain untouched and only `.quantflow` is newly emitted.
- The official README and current runtime/demo documents state the three-root layout. Upstream
  source seams, attribution, history, `@collab/*`, `collab-file`, and tmux compatibility names remain.
- `product-identity` couples the pinned source matrix, exact production boot ordering, dynamic
  migration/failure/retry proof, and workspace consumer ordering. Package inspection now rejects a
  wrong executable, ASAR package name, or update target in the real Linux directory package.

## One complete builder acceptance

The isolated worktree received a frozen install. Two sandbox-denied install attempts left one
generated dependency manifest at zero bytes; `bun install --force --frozen-lockfile` repaired that
generated tree without a lockfile or source change. The successful production build then used the
repaired frozen tree. This environmental interruption is recorded rather than presented as a code
failure.

```text
$ cd collab-electron && ./scripts/test-unit.sh
84 pass, 0 fail
139 pass, 0 fail
11 pass, 0 fail
12 pass, 0 fail
29 pass, 0 fail
10 pass, 0 fail
2 pass, 0 fail
27 pass, 0 fail
total: 314 pass, 0 fail

$ bun run build
main: 187 modules transformed
preload: 2 modules transformed
renderer: 10031 modules transformed
exit 0
```

The three focused gates were run in parallel after the complete implementation batch:

```text
$ bun qa/run.ts product-identity
product-identity: bucket B residuals=1
product-identity: bucket C residuals=131
product-identity: bucket D residuals=6
product-identity: migration old-only=7 both=preserved failure=absent retry=published workspace=before-consumers
product-identity: source, delegation, migration, and package identity coupled
PASS  product-identity

$ bun qa/run.ts artifact-root
artifact-root G4 resolver: PASS
artifact-root G4 env not-directory: PASS
artifact-root D5 production writer: PASS
artifact-root K3b A2A production writer: PASS
artifact-root G4 production coupling: PASS
artifact-root K3b A2A production coupling: PASS
artifact-root K3b governed publishers: PASS (a2a-bus.ts, agent-host.ts)
artifact-root OK
PASS  artifact-root

$ bun qa/run.ts kernel-sole-writer-app
kernel-sole-writer-app OK
PASS  kernel-sole-writer-app
```

## Required production falsification

| Deliberate break | Red receipt | Restored receipt |
|---|---|---|
| `build.productName` changed to `Collaborator` | `productName must be QuantFlow, got Collaborator`; exit 1 | migration matrix + source/delegation/package coupling; `PASS product-identity`; exit 0 |
| Removed the real `runAppMigrationBeforeBoot(...)` call while leaving the helper intact | `production boot does not call runAppMigrationBeforeBoot`; exit 1 | migration matrix + source/delegation/package coupling; `PASS product-identity`; exit 0 |
| Restored package publish owner/repo to `collabs-inc/collab-public` | `publish target must be exactly github:SidNig21/QuantFlow-Ontology`; exit 1 | migration matrix + source/delegation/package coupling; `PASS product-identity`; exit 0 |

Each bait edited production, was restored exactly, and left `git diff --check` clean.

## Residual identity ledger

At exact implementation commit `9a0b63f`, before this self-referential evidence file existed, the
gate classified every case-insensitive match for `.collaborator`, `@collaborator/electron`, the
whole word `collaborator`, `collabs-inc`, or `collab-public`. **Bucket A is zero.** Counts below are
match lines, grouped by file; their total is `0 A + 1 B + 131 C + 6 D = 138`.

### A · product identity — 0

No stale product, package, executable, release, default-path, or user-facing chrome match remains.

### B · fork/runtime seam — 1

```text
1 collab-electron/src/main/ipc-endpoint.ts
```

This is the retained Windows named-pipe namespace, not product chrome or durable truth.

### C · lineage, law, history, and negative controls — 131

```text
2 README.md
4 START_HERE.md
2 collab-electron/docs/superpowers/specs/2026-04-05-canvas-event-log-design.md
1 collab-electron/scripts/package-lib/package-inspect.test.ts
2 collab-electron/scripts/package-lib/package-inspect.ts
4 docs/BLUEPRINT.md
2 docs/ROADMAP.md
2 docs/orders/NEXT.md
1 docs/orders/PROPOSAL-schema-drift-detector.md
1 docs/orders/README.md
7 docs/orders/SCOPES.md
1 docs/orders/WO-006b.md
1 docs/orders/WO-006c.md
1 docs/orders/WO-008.md
1 docs/orders/WO-102.md
1 docs/orders/WO-106b.md
6 docs/orders/WO-K1.md
1 docs/orders/WO-K2.md
7 docs/orders/WO-K3.md
1 docs/orders/WO-K3b.md
30 docs/orders/WO-N1.md
3 docs/orders/WO-V1.md
7 docs/orders/evidence/post-merge-review-kernel-identity.md
4 docs/orders/evidence/wo-106/BLOCKER-d6-staging-root.md
1 docs/orders/evidence/wo-V1/VERIFICATION-ROUND-1.md
1 docs/orders/evidence/wo-V1/VERIFICATION-ROUND-2.md
1 docs/orders/evidence/wo-V1/rework-r1/BUILD-REPORT.md
1 docs/orders/evidence/wo-V1/rework-r1/samples/artifact-inline-body.md
1 docs/orders/evidence/wo-V1/rework-r1/samples/artifact-with-backlink.md
1 docs/orders/evidence/wo-k1/VERIFICATION.md
1 docs/orders/evidence/wo-k1/d8-before-after.md
1 docs/orders/evidence/wo-k1/prebuild-read-raw.md
1 docs/orders/evidence/wo-k1/prebuild-read-round2-raw.md
1 docs/orders/evidence/wo-k1/prebuild-read-round2.md
2 docs/orders/evidence/wo-k1/prebuild-read-round3-raw.md
1 docs/orders/evidence/wo-k1/prebuild-read.md
3 docs/orders/evidence/wo-k3/BUILD-REPORT.md
1 docs/orders/evidence/wo-v1/prebuild-read.md
4 docs/superpowers/plans/2026-04-04-agent-sidebar.md
2 docs/superpowers/specs/2026-04-04-agent-sidebar-design.md
2 qa/gates/artifact-root/run.ts
1 qa/gates/kernel-sole-writer-app.ts
12 qa/gates/product-identity.ts
1 tools/qf-vault-projection/src/gate.ts
```

The two current README matches are the required fork attribution and the description of legacy
migration input. Package-inspector and QA matches are rejection strings or bait fixtures.

### D · input-only compatibility — 6

```text
1 .gitignore
1 collab-electron/.gitignore
3 collab-electron/src/main/app-migration.ts
1 collab-electron/src/main/cli-installer.ts
```

The ignore entries preserve operator repositories, migration reads the old global/workspace and
Electron inputs, and the installer removes only app-owned obsolete wrappers. None emits an old
default.

## Read-only founder-data guard

The default Kernel was opened with `sqlite3 -readonly`; only aggregate counts were read:

```text
all_artifacts=0
old_refs=0
```

No Kernel row, artifact byte, legacy app root, credential, process, bet, or trade was touched.
WO-N1 gives no deletion advice and never deletes or moves the old root.

## Judgment

The atomic boundary publishes the whole global destination because app-local state and Electron
state must become visible together; per-worktree Electron bytes are placed below the same staged
root. Global breadcrumbs and host-mount policy use `QF_APP_ROOT`, while canvas/config/PTY/log/socket
state uses `QF_APP_DIR`, preserving development isolation. The gate imports the exact production
migration helper and scans the real boot call so a correct helper that is not called still fails.
No dependency, schema, Kernel path, artifact root, release credential, or upstream seam changed.

## Cold integration repair

Independent verification of candidate `c7f955a` built and inspected the real Linux package, then
found the new migration gate's intentional legacy `kernel.db` exclusion canary was not declared to
the older `kernel-one-path` scanner. The scanner failed before later QA could run:

```text
kernel-one-path G1: offenders outside allowlist:
  - qa/gates/product-identity.ts (kernel.db path construction/literal)
FAIL  kernel-one-path
```

Repair `a710786` adds exactly `qa/gates/product-identity.ts` to that fixture allowlist, with a comment
stating why. It does not allow a directory or production prefix. Focused falsification created a
sibling QA file carrying the same literal: the scanner rejected that sibling, exit 1; removing it
restored `kernel-one-path G1: PASS`. `product-identity` remained green with its full migration
matrix. The first candidate's cold package receipts remain evidence, not a PASS verdict; the repaired
exact candidate still requires independent verification.

## Electron migration repair

Exact candidate `c69bb46` passed the full cold release verifier and all three required production
baits. The independent verifier then widened the unsafe-entry probe to legacy Electron `userData`
and found `kernel.db`, a PID file, and an artifact directory copied into the same staged app root.
The helper passed the exclusion predicate for legacy app state but `null` for Electron state.

Repair `b3cbc1f` passes the same `isExcludedGlobalEntry` predicate to the Electron subtree and adds
four permanent Electron-source canaries: Kernel, PID, artifact, and generated socket breadcrumb.
Focused production falsification changed only the Electron predicate back to `null`:

```text
product-identity: migration matrix failed: excluded Electron entry migrated: kernel.db
FAIL  product-identity
exit 1
```

Restoring the production predicate reran the complete old-only/both-exist/failure/retry/workspace
matrix and printed `PASS product-identity`. Source hashes remained unchanged. No other migration,
package, schema, dependency, Kernel, or artifact behavior changed; the new exact candidate still
requires an independent cold verdict.
