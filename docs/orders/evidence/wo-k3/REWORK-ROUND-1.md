# WO-K3 — rework round 1 build report

The app now proves that its real report writer creates the bytes the Kernel records, and the full
Linux release check catches regressions before they can ship.

| | |
|---|---|
| Branch | `codex/wo-k3-rework` off `main` @ `f1dd196` |
| Original WO-K3 import | `ec51c34` cherry-picked as `5acc8f4` |
| Reworker | Codex lead architect |
| Status | builder green; awaiting independent verification |
| Supersedes | D5 evidence in `BUILD-REPORT.md` only; that historical report remains on disk |

## Why rework was required

The original D5 gate created the accepted artifact file with `writeFileSync()` and then called
`execute("publish_artifact")`. That demonstrated that the Kernel could index gate-authored bytes;
it did not demonstrate that the Electron production writer created them. Its claimed production
proof was therefore false.

## Corrected D5 production proof

- `collab-electron/src/main/agent-artifact-writer.ts` is an import-safe production seam: resolve
  the supplied platform artifact root, write the report bytes, then call the supplied sanctioned
  Kernel publication callback.
- `agent-host.ts` imports and calls that helper. It no longer contains a second report byte writer.
- `qa/gates/artifact-root/run.ts` begins with the accepted path absent, invokes the production
  helper, then checks the file, the Kernel row, `storage_ref`, and content hash against bytes read
  back from disk.
- The gate itself does not call `writeFile()` or `writeFileSync()` for the accepted file.

Falsification and restore:

```text
QF_ARTIFACT_ROOT_FALSIFY=writer bun qa/run.ts artifact-root
artifact-root FAIL: production writer did not create publishable bytes: ENOENT .../gate-report.md
EXIT=1

bun qa/run.ts artifact-root
artifact-root D5 production writer: PASS
artifact-root G4 production coupling: PASS
PASS  artifact-root
EXIT=0
```

## Independent remeasurement of imported WO-K3 work

Focused results before the full verifier:

```text
packages/qf-kernel: 60 pass, 0 fail
kernel-drift: PASS
publish-artifact-root: PASS (outside absolute, traversal, symlink, and prefix sibling reject;
inside-root accepts; missing root fail-closes)
kernel-sole-writer: PASS
kernel-sole-writer-app: PASS
kernel-one-path: PASS, including MCP row round-trip
```

Existing WO-K3 baits were rerun rather than trusted:

```text
QF_KERNEL_DRIFT_GATE_FALSIFY=1 bun qa/run.ts kernel-drift       -> EXIT=1
QF_KERNEL_DRIFT_ENFORCE_OFF=1 bun qa/run.ts kernel-drift        -> EXIT=1
bun qa/run.ts kernel-drift                                      -> EXIT=0
```

## Defects the canonical verifier found

The first `bun qa/verify-release.ts` run went red in two places that the original builder report
missed:

1. Strict TypeScript: `attach-kernel-drift.test.ts:141` dereferenced a value still typed as
   nullable (`TS18047`). The test now performs an explicit null guard; package and repo typechecks
   pass.
2. Tool-plane regression: its old extensibility fixture added an unregistered `experimental`
   table to the shared shipping fixture. WO-K3 correctly refused the next attach with
   `KernelRegistryDriftError: inconsistent=[experimental]`. The deliberately dirty extension now
   lives in its own fixture database and is written only after the server has attached to a valid
   registry. Drift enforcement was not disabled or relaxed.

These failures and their green restores are the falsification transcript for the two compatibility
repairs.

## Canonical Linux shipped-form verification

Command:

```text
env TMPDIR=/tmp/qf-bun-tmp-k3 BUN_INSTALL_CACHE_DIR=/tmp/qf-bun-cache-k3 \
  bun qa/verify-release.ts
```

Final result:

```text
release:install: PASS (frozen Electron install)
release:unit: 258 pass, 0 fail
release:build: PASS (180 main modules, 2 preload modules, 10031 renderer modules)
schema: 152 pass, 0 fail
kernel: 60 pass, 0 fail
typecheck: PASS
tool-plane: PASS
kernel-drift: PASS
artifact-root: PASS
vault-projection: PASS
PASS  release-verification
EXIT=0
```

This is builder evidence from the working branch, not an independent verdict. The exact committed
tip still requires a cold detached-worktree verifier run.

## Review and judgment

Cursor CLI was invoked twice in read-only mode with `composer-2.5`, per the operator constraint,
but returned no review within bounded 180-second windows. It was stopped without edits; no
favorable review is claimed.

The repository's Windows origin explains some surviving cross-platform and local-package seams,
but Linux is the shipped-form authority for this founder-only product. The canonical frozen install
is necessary before every build because a reused `node_modules` can retain an older local
`qf-kernel` export surface; a cold/frozen install followed by the production build is the proof.
