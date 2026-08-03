# WO-CI1 — Builder report (architect-corrected D1)

## 1. Plain language

The release build was failing because the app kept a private list of schema import paths that no longer matched the package; I deleted those private aliases so the installed package exports resolve the imports, and added a permanent check that fails if private aliases return or the packages stop being bundled.

## 2. Deliverable 0 — baseline failure

**Commands:**

```bash
cd collab-electron
bun install --frozen-lockfile
bun run build
```

**Result:** exit `1` (measured before the config edit; retained as the D0 transcript)

**Exact unresolved import:**

```
[vite:load-fallback] Could not load /home/sidnig21/qf-worktrees/wo-ci1/qf-kernel-schema/src/schema.ts/transition-meta (imported by ../packages/qf-kernel/src/execute.ts): ENOTDIR: not a directory, open '/home/sidnig21/qf-worktrees/wo-ci1/qf-kernel-schema/src/schema.ts/transition-meta'
```

**Mechanism:** live import `qf-kernel-schema/transition-meta` was swallowed by the bare `qf-kernel-schema` alias pointing at `schema.ts`. Order is not stale. Per the architect correction, later rework does not re-fail D0 after the corrected config builds green.

## 3. Changed files

| File | Why it belongs |
|------|----------------|
| `collab-electron/electron.vite.config.ts` | D1 — remove private `qf-kernel*` aliases; keep both packages in `externalizeDeps.exclude` |
| `qa/gates/schema-bundle-aliases.ts` | D2 — install-free production-coupling + manifest gate with three falsify modes |
| `qa/run.ts` | D2 — register `schema-bundle-aliases` |
| `docs/orders/evidence/wo-ci1/BUILD-REPORT.md` | Report-back |

No lockfile, schema, golden, Kernel, or dependency changes. The earlier derived-alias helper and unit test were never committed under the corrected order.

## 4. Manual alias count and live exports

**Manual `qf-kernel*` alias count in `main.resolve.alias`:** `0`

**Live package export counts:**

- `qf-kernel`: 2 exports (`.` , `./portable`)
- `qf-kernel-schema`: 8 string exports (`.` plus 7 subpaths)

## 5. Build and static-gate outputs

### Production build

```bash
cd collab-electron
bun install --frozen-lockfile
bun run build
```

```
✓ 177 modules transformed.   # main
✓ built in 1.10s
✓ built in 30ms              # preload
✓ 10031 modules transformed. # renderer
✓ built in 51.06s
exit 0
```

### Static gates (repo root)

```
PASS  schema-bundle-aliases
PASS  repo-shape
PASS  lockfile-committed
PASS  kernel-sole-writer
PASS  no-canvas-domain-writes
PASS  kernel-sole-writer-app
PASS  doc-action-surface
PASS  one-skin
```

## 6. Red bait / restored green

```bash
cd "$(git rev-parse --show-toplevel)"
QF_SCHEMA_BUNDLE_ALIASES_FALSIFY=alias bun qa/run.ts schema-bundle-aliases
```

```
schema-bundle-aliases: forbidden private alias: main.resolve.alias must not reference qf-kernel or qf-kernel-schema
FAIL  schema-bundle-aliases
exit=1
```

```bash
QF_SCHEMA_BUNDLE_ALIASES_FALSIFY=exclude bun qa/run.ts schema-bundle-aliases
```

```
schema-bundle-aliases: missing bundle exclude: externalizeDeps.exclude must include qf-kernel-schema
FAIL  schema-bundle-aliases
exit=1
```

```bash
QF_SCHEMA_BUNDLE_ALIASES_FALSIFY=manifest bun qa/run.ts schema-bundle-aliases
```

```
schema-bundle-aliases: qf-kernel manifest must export "./portable" as a string path
FAIL  schema-bundle-aliases
exit=1
```

```bash
bun qa/run.ts schema-bundle-aliases
```

```
PASS  schema-bundle-aliases
exit=0
```

## 7. Judgment exercised

None beyond the architect correction already recorded in `WO-CI1.md`: package-export resolution beat a generated alias mirror after the alias path broke `zod` resolution. This builder followed that ruling.

## 8. Verifier deferral

Cold detached-worktree `bun qa/run.ts --all` (plus unit tests) is **deferred to the independent verifier**. This builder does not self-certify PASS.
