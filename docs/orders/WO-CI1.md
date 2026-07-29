# WO-CI1 — Restore the production build verifier

status: open — founder-approved interruption before WO-K3
assignee: builder
depends: WO-K2 — **done** (`c9c3bf0`)
blocks: WO-K3 verification and every later order
closes: ROADMAP debt **#31**
ladder: off-ladder repair

---

## Objective

Make the Electron production bundle resolve `qf-kernel` and `qf-kernel-schema` through their
authoritative package export maps, and make any new private alias mirror fail a permanent gate.

## In plain terms

The app's release build is broken because its private list of schema entry points fell behind the
schema package. Until this is repaired, CI stops before the safety gates and later work can appear
healthy without the machine checking it.

## Context pack

Read before editing:

1. [`START_HERE.md`](../../START_HERE.md)
2. [`PROTOCOL.md`](PROTOCOL.md)
3. [`collab-electron/electron.vite.config.ts`](../../collab-electron/electron.vite.config.ts)
4. [`qf-kernel-schema/package.json`](../../qf-kernel-schema/package.json), `exports`
5. [`packages/qf-kernel/src/execute.ts`](../../packages/qf-kernel/src/execute.ts) and
   [`links.ts`](../../packages/qf-kernel/src/links.ts), the live subpath imports
6. Vite official `resolve.alias` documentation:
   <https://vite.dev/config/shared-options#resolve-alias>
7. electron-vite official configuration documentation:
   <https://electron-vite.org/config/>
8. Bun official isolated-install documentation:
   <https://bun.sh/docs/pm/isolated-installs>

External facts pinned by those docs: electron-vite's `main.resolve` accepts Vite configuration;
Vite resolves packages through normal package resolution when no alias replaces them; Bun's
isolated install gives declared `file:` packages their dependency graph under `node_modules/.bun`.

## Deliverable 0 — re-measure before repair

From this order's clean worktree, run:

```bash
cd collab-electron
bun install --frozen-lockfile
bun run build
```

Confirm the build fails while resolving a live `qf-kernel-schema` export such as
`transition-meta` or `link-endpoints`.

If the clean build does not fail for that mechanism, stop. Report the order as stale; do not make a
speculative config change.

**Rework exception after the architect correction below:** D0 is already satisfied by the committed
builder report's pre-edit transcript. A rework builder starts from corrected D1/D2 and must not stop
because the experimentally corrected config now builds green.

## Deliverables

### D1 — use package exports directly

- Remove every `qf-kernel-schema` alias and the `qf-kernel/portable` alias from
  `collab-electron/electron.vite.config.ts`.
- Keep both packages in `main.build.externalizeDeps.exclude`; that tells electron-vite to bundle
  the installed TypeScript packages instead of externalizing them.
- Keep the unrelated `@collab/shared` alias unchanged. Object or array form is acceptable.
- Add no `zod` alias, dependency alias, or path into `node_modules/.bun`.
- Add no dependency or lockfile change. The existing `file:` package manifests and Bun install
  graph own package resolution.

### D2 — production-coupling gate

- Add a static, install-free `schema-bundle-aliases` QA gate and register it in `qa/run.ts`.
- The gate reads `electron.vite.config.ts` as source text without importing `electron-vite`.
- Its production checker isolates the `main.resolve.alias` block and fails if that block contains
  `qf-kernel` or `qf-kernel-schema` in any alias key, `find`, or replacement.
- The same checker isolates `main.build.externalizeDeps.exclude` and fails unless it contains both
  exact package names: `qf-kernel` and `qf-kernel-schema`.
- The gate reads both live package manifests and fails unless `qf-kernel` exports `"./portable"`
  and `qf-kernel-schema` has string `"."` plus string subpath exports. It does not copy or enumerate
  the current schema subpath names.
- Add three in-memory falsify values through the real checker; bare forced exits are forbidden:
  - `QF_SCHEMA_BUNDLE_ALIASES_FALSIFY=alias` adds a `qf-kernel-schema` alias to the alias block and
    fails naming the forbidden private alias.
  - `QF_SCHEMA_BUNDLE_ALIASES_FALSIFY=exclude` removes `qf-kernel-schema` from the parsed
    `externalizeDeps.exclude` block and fails naming the missing bundle exclude.
  - `QF_SCHEMA_BUNDLE_ALIASES_FALSIFY=manifest` removes `qf-kernel`'s `"./portable"` export from an
    in-memory manifest passed to the real manifest checker and fails naming that export.

### D3 — restore the existing verifier chain

- The existing CI order remains Install → Unit tests → Build → QA gates.
- A clean production build must succeed before the QA board is reported.
- Do not change Bun pinning in this repair; the unpinned setup action remains WO-H2 audit scope.

## Contract

- No inline imports; imports stay at module top.
- No package, lockfile, schema, generated golden, Kernel, or runtime behavior changes.
- The package manifest remains the sole declaration of exported schema subpaths.
- Do not weaken bundling by externalizing `qf-kernel` or `qf-kernel-schema`.
- Do not hand-copy the current export keys into code or tests.
- Do not rely on Bun's internal `.bun` storage path; only the package manager may consume it.

## Acceptance gates

### Builder-run

```bash
cd collab-electron
bun install --frozen-lockfile
bun run build
cd ..
bun qa/run.ts schema-bundle-aliases
bun qa/run.ts repo-shape
bun qa/run.ts lockfile-committed
bun qa/run.ts kernel-sole-writer
bun qa/run.ts no-canvas-domain-writes
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts doc-action-surface
bun qa/run.ts one-skin
```

Expected: all commands exit `0`.

### Required bait transcript

```bash
cd "$(git rev-parse --show-toplevel)"
QF_SCHEMA_BUNDLE_ALIASES_FALSIFY=alias bun qa/run.ts schema-bundle-aliases
QF_SCHEMA_BUNDLE_ALIASES_FALSIFY=exclude bun qa/run.ts schema-bundle-aliases
QF_SCHEMA_BUNDLE_ALIASES_FALSIFY=manifest bun qa/run.ts schema-bundle-aliases
bun qa/run.ts schema-bundle-aliases
```

Expected: the first three commands each exit non-zero and name, respectively, the forbidden alias,
missing bundle exclude, and missing package export; restored command exits `0`.

### Verifier-run

In a detached clean worktree:

```bash
cd collab-electron
bun install --frozen-lockfile
./scripts/test-unit.sh
bun run build
cd ..
bun qa/run.ts --all
```

The builder reports evidence and stops. A different seat decides PASS or REWORK.

## Out of scope

- WO-K3 code, order text, branch, artifact storage, or registry drift
- `node:sqlite` transaction behavior
- PTY or canvas socket authentication
- Product naming, app data roots, publishing, updater, installer, or packaging
- Bun-version pinning
- Any dependency or lockfile change

## Report back

1. One plain-language sentence.
2. Deliverable 0 failure command and the exact unresolved import.
3. Changed files and why each belongs to this order.
4. Manual `qf-kernel*` alias count (`0`) and live package export counts.
5. Build and static-gate outputs.
6. Red bait output, restored green output.
7. Judgment exercised; if none, say none.
8. State that cold `--all` is deferred to the independent verifier.

---

## Architect correction — package resolution beats a generated alias mirror (2026-07-28)

The first builder followed the original D1 and derived all schema aliases from the live manifest.
That fixed `transition-meta`, then the bundle failed to resolve `zod` because aliasing source files
outside `collab-electron/node_modules` bypassed Bun's installed dependency graph. A proposed
`node_modules/.bun/node_modules/zod` alias made the build green but depended on package-manager
internals and violated the unchanged-unrelated-alias contract.

Control measurements in the same frozen install:

1. Remove only schema aliases while retaining the source alias for `qf-kernel/portable` → build
   fails resolving `qf-kernel-schema` from the source Kernel.
2. Remove both private package aliases and retain both packages in
   `externalizeDeps.exclude` → full main/preload/renderer build exits `0`; Vite transforms 177 main
   modules and Bun's installed package graph supplies `zod`.

Ruling: D1 is replaced by direct package-export resolution above. Delete the derived-alias helper
and its unit test; rewrite the gate to forbid package aliases and protect the two bundle excludes.
This is an order correction from measured behavior, not builder discretion.
