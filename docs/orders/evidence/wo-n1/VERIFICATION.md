# WO-N1 independent verification — PASS

QuantFlow now ships under its own name and preserves eligible founder app, browser, and workspace state while refusing to copy unsafe legacy files.

Verified candidate: `1aaa82b4bbd24963cb01b0a7344d5ebaf7d38707`

Base: `d5886ded0f708145178063fe7f95f4baf4efbe83`

Verifier worktree: `/tmp/qf-n1-verify-1aaa82b` (fresh detached worktree; no pre-existing `collab-electron/node_modules`)

This report is the verifier's only change. It does not rotate an order, merge a branch, publish a release, read credentials, or mutate founder data.

## Verdict

**PASS.** The exact candidate passed the canonical cold release verifier, including the real unsigned Linux directory package and every QA gate. All three required production baits failed for the intended reason and returned green after exact restoration. An independent widened migration probe also proved unsafe entries are excluded from the legacy Electron subtree while persistent browser bytes and both legacy sources remain intact.

Two earlier candidates were rejected rather than excused:

- `c7f955a` failed the existing single-Kernel-path gate because its new migration fixture was not registered as an exact fixture exception.
- `c69bb46` passed the board but an independent widened probe found unsafe Electron-source entries were copied. The final candidate applies the same exclusion predicate to both staged source trees and permanently tests that boundary.

## Canonical cold release verification

Command, run once from the fresh worktree root:

```text
bun qa/verify-release.ts
```

Receipt:

```text
release: runId=4327d8bb-524b-48e6-8684-45bc1a487ec5
== release:install (collab-electron) :: bun install --frozen-lockfile ==
2341 packages installed
== release:unit (collab-electron) :: ./scripts/test-unit.sh ==
0 fail in every unit group
== release:build (collab-electron) :: bun run build ==
main, preload, and 10031-module renderer production builds completed
== release:package (collab-electron) :: bun run package:verify ==
package:verify: PASS
== release:qa (.) :: bun qa/run.ts --all ==
PASS  kernel-one-path
PASS  artifact-root
PASS  product-identity
PASS  vault-projection
PASS  release-verification
```

The package stage used `electron-builder --dir --linux --x64 --publish never`; it did not sign, upload, execute a release, or read a release credential.

## D1 and D3 — shipped identity, installer, CLI, and chrome

The production inspector resolved the actual finished package and reported:

```text
dist/linux-unpacked/quantflow                                           202792152 bytes, executable
app.asar:package.json                                                   1281 bytes
dist/linux-unpacked/resources/app-update.yml                            108 bytes
```

The ASAR manifest name is `@quantflow/electron`. The update document is:

```text
owner: SidNig21
repo: QuantFlow-Ontology
provider: github
updaterCacheDirName: '@quantflowelectron-updater'
```

Source inspection also confirmed the pinned matrix: app id `com.quantflow.ontology`, product name `QuantFlow`, long release title `QuantFlow Ontology`, Linux install/executable `quantflow`, canvas control command `qf-canvas`, and release repository `SidNig21/QuantFlow-Ontology`. The upstream remote remained `https://github.com/collaborator-ai/collab-public.git`; the fork directory, internal package seams, history, and attribution were not renamed.

## D2 — staged app, Electron, and workspace migration

The exact production helper produced this permanent gate receipt:

```text
product-identity: migration old-only=7 both=preserved failure=absent retry=published workspace=before-consumers
```

Independent code and execution checks established:

- Production resolves global state to `~/.quantflow/app` and development state beneath `~/.quantflow/app/dev/worktree-<id>`.
- Boot calls `runAppMigrationBeforeBoot()` before binding Electron `userData` to `QF_APP_DIR/electron`, before logger initialization, and before `loadConfig()`.
- Old-only migration copies persistent app and browser canaries byte-for-byte through a sibling stage and one rename.
- If the new root already exists, its hash stays byte-identical and the legacy source stays intact.
- An injected copy failure publishes no final root, removes its stage, leaves the source hash unchanged, and succeeds on retry.
- Symbolic links are not followed. Kernel, artifact, PID, socket, and endpoint-breadcrumb canaries are excluded.
- Existing configured-workspace boot, workspace add, config lookup, thumbnail-cache selection, and replay-cache selection all call the shared workspace migration before consuming `.quantflow` metadata.
- The old workspace ignore entry remains legal input compatibility and the new ignore entry is added.

Independent widened Electron-source probe through `migrateLegacyAppState()`:

```json
{"status":"migrated","cookie":"cookie","copiedKernel":false,"copiedPid":false,"copiedArtifacts":false,"copiedBreadcrumb":false,"sourceKernelStillPresent":true,"sourceCookieStillPresent":true}
```

The Kernel resolver remains unchanged at `~/.quantflow/kernel.db`; app migration neither opens nor relocates it. Artifact bytes remain under `~/.quantflow/artifacts/`.

## D4 and D5 — permanent gates and falsification

### Bait 1 — revert the real product name

Changed only `build.productName` in the production package configuration.

Red:

```text
product-identity: productName must be QuantFlow, got Collaborator
FAIL  product-identity
exit=1
```

Exact restore, green:

```text
product-identity: bucket B residuals=1
product-identity: bucket C residuals=136
product-identity: bucket D residuals=6
product-identity: migration old-only=7 both=preserved failure=absent retry=published workspace=before-consumers
PASS  product-identity
exit=0
```

### Bait 2 — remove the real boot delegation

Removed only the production `runAppMigrationBeforeBoot({...})` call; the helper and its dynamic migration proof remained present.

Red:

```text
product-identity: production boot does not call runAppMigrationBeforeBoot
FAIL  product-identity
exit=1
```

Exact restore returned the same complete green migration receipt and `PASS  product-identity`.

### Bait 3 — poison the finished package update target

Changed only the already-built real package's `resources/app-update.yml` owner/repository, then called the same production package inspector used by packaging and package closure.

Red:

```json
{"ok":false,"reason":"packaged update target mismatch: provider=github owner=collabs-inc repo=collab-public"}
```

Exact restore, green:

```json
[
  {"path":".../dist/linux-unpacked/quantflow","bytes":202792152},
  {"path":"app.asar:package.json","bytes":1281},
  {"path":".../dist/linux-unpacked/resources/app-update.yml","bytes":108}
]
```

After all baits, `git diff --exit-code`, `git diff --check`, and `git status --short` showed the exact candidate restored with no tracked changes.

## D6 — current documentation

The official README documents the shipped executable and canvas command plus the final three-root layout:

```text
~/.quantflow/kernel.db
~/.quantflow/artifacts/
~/.quantflow/app/
```

Current demo/runtime documents use the same layout. Historical evidence and fork attribution remain historical evidence and attribution.

## Residual identity inventory

The exact pre-report candidate scan found 143 matching tracked lines. Bucket A is zero.

| Bucket | Count | Complete inventory |
|---|---:|---|
| A — stale product identity | 0 | none |
| B — fork/internal compatibility seam | 1 | `collab-electron/src/main/ipc-endpoint.ts:6` (stable socket namespace) |
| D — input-only migration/cleanup compatibility | 6 | `.gitignore:15`; `collab-electron/.gitignore:37`; `collab-electron/src/main/app-migration.ts:257,279,303`; `collab-electron/src/main/cli-installer.ts:25` |
| C — lineage, law, history, and gate fixtures | 136 | complete per-file inventory below |

Bucket C per-file line counts (sum 136):

```text
README.md 2
START_HERE.md 4
collab-electron/docs/superpowers/specs/2026-04-05-canvas-event-log-design.md 2
collab-electron/scripts/package-lib/package-inspect.test.ts 1
collab-electron/scripts/package-lib/package-inspect.ts 2
docs/BLUEPRINT.md 4
docs/ROADMAP.md 2
docs/orders/NEXT.md 2
docs/orders/PROPOSAL-schema-drift-detector.md 1
docs/orders/README.md 1
docs/orders/SCOPES.md 7
docs/orders/WO-006b.md 1
docs/orders/WO-006c.md 1
docs/orders/WO-008.md 1
docs/orders/WO-102.md 1
docs/orders/WO-106b.md 1
docs/orders/WO-K1.md 6
docs/orders/WO-K2.md 1
docs/orders/WO-K3.md 7
docs/orders/WO-K3b.md 1
docs/orders/WO-N1.md 30
docs/orders/WO-V1.md 3
docs/orders/evidence/post-merge-review-kernel-identity.md 7
docs/orders/evidence/wo-106/BLOCKER-d6-staging-root.md 4
docs/orders/evidence/wo-V1/VERIFICATION-ROUND-1.md 1
docs/orders/evidence/wo-V1/VERIFICATION-ROUND-2.md 1
docs/orders/evidence/wo-V1/rework-r1/BUILD-REPORT.md 1
docs/orders/evidence/wo-V1/rework-r1/samples/artifact-inline-body.md 1
docs/orders/evidence/wo-V1/rework-r1/samples/artifact-with-backlink.md 1
docs/orders/evidence/wo-k1/VERIFICATION.md 1
docs/orders/evidence/wo-k1/d8-before-after.md 1
docs/orders/evidence/wo-k1/prebuild-read-raw.md 1
docs/orders/evidence/wo-k1/prebuild-read-round2-raw.md 1
docs/orders/evidence/wo-k1/prebuild-read-round2.md 1
docs/orders/evidence/wo-k1/prebuild-read-round3-raw.md 2
docs/orders/evidence/wo-k1/prebuild-read.md 1
docs/orders/evidence/wo-k3/BUILD-REPORT.md 3
docs/orders/evidence/wo-n1/BUILDER.md 5
docs/orders/evidence/wo-v1/prebuild-read.md 1
docs/superpowers/plans/2026-04-04-agent-sidebar.md 4
docs/superpowers/specs/2026-04-04-agent-sidebar-design.md 2
qa/gates/artifact-root/run.ts 2
qa/gates/kernel-sole-writer-app.ts 1
qa/gates/product-identity.ts 12
tools/qf-vault-projection/src/gate.ts 1
```

The exact scanning expression was:

```text
git grep -n -I -i -P '(?:\.collaborator|@collaborator/electron|\bcollaborator\b|collabs-inc|collab-public)' HEAD --
```

The inventory is explicitly for the candidate before this historical verifier report was added.

## Founder Kernel read-only safety check

Command:

```text
sqlite3 -readonly /home/sidnig21/.quantflow/kernel.db <two COUNT-only SELECT statements>
```

Output:

```text
all_artifacts=0
old_root_refs=0
```

No operator data was written, moved, deleted, or opened writable. This count permits only the statement that no current artifact row references the old app root; this order still gives no deletion advice and does not delete the legacy source.

## Judgment

The order says unsafe state must never enter the staged app root. I interpreted that rule as applying equally to legacy Electron `userData`, because Electron bytes are copied into the same stage and atomically published as part of `QF_APP_ROOT`. That widened probe rejected the previous candidate and produced the final one-line production correction plus permanent canaries. I treated the stable IPC namespace, source filenames, internal `@collab/*` seams, upstream remote, license, and historical records as compatibility/lineage rather than product identity, exactly as the order's buckets require.
