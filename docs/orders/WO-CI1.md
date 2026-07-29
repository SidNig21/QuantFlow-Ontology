# WO-CI1 — Restore the production build verifier

status: open — founder-approved interruption before WO-K3
assignee: builder
depends: WO-K2 — **done** (`c9c3bf0`)
blocks: WO-K3 verification and every later order
closes: ROADMAP debt **#31**
ladder: off-ladder repair

---

## Objective

Make the Electron production bundle resolve every exported `qf-kernel-schema` subpath from one
authoritative package manifest, and make drift fail a permanent gate.

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

External facts pinned by those docs: electron-vite's `main.resolve` accepts Vite configuration;
filesystem alias replacements must be absolute; alias entry order is significant.

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

## Deliverables

### D1 — one derived alias map

- Add `collab-electron/src/main/schema-export-aliases.ts` exporting
  `derivePackageExportAliases(packageName, packageRoot)`.
- The helper returns Vite's ordered array form:
  `Array<{ find: string; replacement: string }>`.
- Replace the hand-maintained `qf-kernel-schema` alias entries in
  `collab-electron/electron.vite.config.ts`. The config imports
  `derivePackageExportAliases`, assigns its result to `schemaAliases`, changes
  `main.resolve.alias` to the ordered array form, and spreads `...schemaAliases` into that array.
- Derive aliases at config load from `qf-kernel-schema/package.json`'s `exports` object.
- Every declared string export, including `"."`, maps to its corresponding absolute filesystem
  target. Export key `"."` maps to import specifier `qf-kernel-schema`; `"./commands"` maps to
  `qf-kernel-schema/commands`, and the same rule applies to every other subpath.
- Order entries longest import specifier first, so a bare-package alias cannot swallow a subpath.
- Keep unrelated aliases as array entries with their current replacements. Place
  `...schemaAliases` before the bare `qf-kernel/portable` and `@collab/shared` entries.
- Keep `qf-kernel` bundling unchanged.
- Add no dependency and do not create a second manifest or copied export list.

### D2 — focused tests and a production-coupling gate

- Put the derivation in a small importable TypeScript helper with unit coverage for:
  - root and subpath conversion;
  - absolute targets;
  - longest-first order;
  - malformed/non-string export rejection.
- Add a static, install-free `schema-bundle-aliases` QA gate and register it in `qa/run.ts`.
- The gate imports the helper, reads the live schema package manifest, and reads the live Electron
  config as source text without importing `electron-vite`.
- The live-manifest check invokes `derivePackageExportAliases` and fails if an export target file is
  absent, a replacement is non-absolute, ordering is not longest-first, or the alias count differs
  from the manifest's string-export count.
- The production-coupling checker fails unless the config source:
  - imports `derivePackageExportAliases` from `./src/main/schema-export-aliases`;
  - assigns the live result to `schemaAliases`;
  - uses array-form `main.resolve.alias` and spreads `...schemaAliases` into it.
- The same checker fails if the config's alias entries contain a hand-maintained
  `find: "qf-kernel-schema/<subpath>"` or a quoted object key
  `"qf-kernel-schema/<subpath>":`. Do not reject ordinary filesystem strings containing
  `../qf-kernel-schema/`.
- Add `QF_SCHEMA_BUNDLE_ALIASES_FALSIFY=1`. It must plant an in-memory broken production-coupling
  input by removing `...schemaAliases` from the source text passed to the real coupling checker.
  The checker must fail with a message that names the missing spread; a bare forced exit is
  forbidden.

### D3 — restore the existing verifier chain

- The existing CI order remains Install → Unit tests → Build → QA gates.
- A clean production build must succeed before the QA board is reported.
- Do not change Bun pinning in this repair; the unpinned setup action remains WO-H2 audit scope.

## Contract

- No inline imports; imports stay at module top.
- No package, lockfile, schema, generated golden, Kernel, or runtime behavior changes.
- The package manifest remains the sole declaration of exported schema subpaths.
- Do not weaken bundling by externalizing `qf-kernel` or `qf-kernel-schema`.
- Do not hand-copy the eight current export keys into code or tests.

## Acceptance gates

### Builder-run

```bash
cd collab-electron
bun install --frozen-lockfile
bun test src/main/schema-export-aliases.test.ts
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
QF_SCHEMA_BUNDLE_ALIASES_FALSIFY=1 bun qa/run.ts schema-bundle-aliases
bun qa/run.ts schema-bundle-aliases
```

Expected: first command exits non-zero and names the missing production coupling; restored command
exits `0`.

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
4. Derived alias count and ordered import specifiers.
5. Unit, build, and static-gate outputs.
6. Red bait output, restored green output.
7. Judgment exercised; if none, say none.
8. State that cold `--all` is deferred to the independent verifier.
