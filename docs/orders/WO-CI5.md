# WO-CI5 — Typecheck installs each dependency once

status: **target verified — canonical successor pending**
assignee: builder
depends: WO-CI4 candidate `8ef6d20`
blocks: CI3/CI4 canonical PASS · WO-107c verification
kind: off-ladder cold-verifier correction

## Objective

Remove the two redundant nested Kernel installers and make the typecheck gate reject package-manager
installs hidden inside lifecycle scripts before a cold verifier can execute them.

## In plain terms

QuantFlow's release check installs the Kernel correctly, then old peer-bus and read-tools setup hooks
try to install it again; remove the duplicate work and prevent it from returning.

## Measured failure

The sole canonical run on verified CI4 candidate `8ef6d20` used run ID
`e7d6f154-ca12-41ad-8649-8878aa99e723`. Production build and package inspection passed, including
qf-toolloop and all Hermes controls. `release:qa` exited `1` because the `typecheck` gate reached
`tools/qf-peer-bus` and its lifecycle hook recursively launched another install:

```text
tools/qf-peer-bus/package.json
"postinstall": "cd ../../packages/qf-kernel && bun install"

error: bun is unable to write files to tempdir: ReadOnlyFileSystem
typecheck: bun install in .../tools/qf-peer-bus exited 1
FAIL  typecheck
```

The failure reproduces on the first `bun qa/run.ts typecheck` in a second fresh clone. The first two
packages install successfully; the peer-bus nested installer is the exact failing boundary. A later
run can pass because the failed attempt already populated dependencies, which violates the cold-state
rule and makes retrying dishonest.

The live typecheck gate already computes and installs the transitive closure of local `file:`
dependencies before typechecking. `packages/qf-kernel` and `qf-kernel-schema` are therefore installed
before `tools/qf-peer-bus`; the postinstall is obsolete, not load-bearing.

The first scanner implementation then exposed the same literal hook in `tools/qf-read-tools` before
any install began. That package is itself a typecheck target and declares both Kernel packages as
local `file:` dependencies, so the same closure proves its hook is equally obsolete. A repository-wide
manifest search found no third package-manager lifecycle install; Electron's unrelated
`node scripts/postinstall.mjs` is an explicit allowed control.

## Ruling

1. Delete only the identical Kernel-installing `postinstall` scripts from
   `tools/qf-peer-bus/package.json` and `tools/qf-read-tools/package.json`. Preserve every other
   script in both packages.
2. Before any typecheck install begins, inspect `preinstall`, `install`, and `postinstall` for every
   package in the typecheck install closure. Apply this exact lexical policy, not a shell parser:
   reject a lifecycle string when one shell segment (bounded by start/end or `;`, `&&`, `||`, `|`)
   contains a bare package-manager token `bun`, `npm`, `pnpm`, or `yarn`, followed later in that same
   segment by the forbidden operation token (`install` for all four; `ci` additionally for `npm`).
   Whitespace and intervening flags/arguments do not matter, so both `bun install` and
   `bun --cwd ../../packages/qf-kernel install --frozen-lockfile` reject.
3. This is deliberately conservative lifecycle authority, not inferred shell execution. A quoted or
   echoed package-manager/install instruction in one lifecycle segment also rejects; lifecycle hooks
   must not carry install instructions as prose. Commands without that ordered pair remain allowed,
   including `node scripts/postinstall.mjs`, `electron-builder install-app-deps`, `bun run build`,
   `npm run build`, and `echo install complete`.
4. The rejection names the package path, lifecycle key, package manager, operation, and full command.
   Before reading live manifests, the gate runs install-free matcher controls proving all five allowed
   examples above remain allowed and the following three shapes reject:
   literal `cd x && bun install`; flagged `bun --cwd x install --frozen-lockfile`; chained
   `echo preparing; npm --prefix x ci`.
5. Add install-free selector modes
   `QF_TYPECHECK_FALSIFY_RECURSIVE_INSTALL=literal|flagged|chained`. Each injects its named command
   into the peer-bus manifest value in memory and must fail before the first `Bun.spawn`. Unknown
   selector values fail closed. Without a selector, no fake manifest or behavior exists.
6. Do not retry failed installs, change temp paths, add dependencies, or weaken frozen installs.
   The fix is one install owner, not a retry or environment workaround.

## Deliverables

- `tools/qf-peer-bus/package.json` — remove the redundant postinstall.
- `tools/qf-read-tools/package.json` — remove the second, identical redundant postinstall exposed by
  the pre-spawn scanner.
- `qa/run.ts` — lifecycle scanner wired before the typecheck install loop plus its install-free
  falsification selector.
- Regenerate `tools/qf-peer-bus/bun.lock` only if frozen Bun reports real manifest drift; do not edit
  it by hand.

## Acceptance

### Builder

From the isolated candidate:

```bash
QF_TYPECHECK_FALSIFY_RECURSIVE_INSTALL=literal bun qa/run.ts typecheck
QF_TYPECHECK_FALSIFY_RECURSIVE_INSTALL=flagged bun qa/run.ts typecheck
QF_TYPECHECK_FALSIFY_RECURSIVE_INSTALL=chained bun qa/run.ts typecheck
bun qa/run.ts typecheck
bun qa/run.ts kernel
```

Each selector exits nonzero before any install and names the injected peer-bus postinstall, manager,
operation, and command. The five allowed controls stay green. Exact restore (selector absent) passes
typecheck in one run. Kernel remains green. Run the standing static gates and `git diff --check`; do
not run the canonical release verifier.

### Independent verifier

From a fresh detached clone with no `node_modules`:

1. Repeat the selector red before install.
2. Run `bun qa/run.ts typecheck` exactly once; it must pass from the genuinely cold clone.
3. Confirm neither `tools/qf-peer-bus` nor `tools/qf-read-tools` has a lifecycle package-manager
   install and Kernel still passes.
4. Run `bun qa/verify-release.ts` exactly once on the successor candidate. It must print
   `PASS release-verification`, retain CI3's five sub-five-second fixtures, and retain every CI4 P2/P4
   control.

## Out of scope

Changing peer-bus behavior or MCP tools · dependency/version changes · package-manager replacement ·
temp-directory workarounds · retries · timeout increases · Electron/Kernel/schema/Dock changes ·
network access · credentials · bets or trades.

## Report back

One plain-language sentence · cold reproduction · removed lifecycle hook · scanner match receipt ·
selector red before install · cold typecheck green once · Kernel/static gates · diff/lockfile status ·
judgment where the order was silent.
