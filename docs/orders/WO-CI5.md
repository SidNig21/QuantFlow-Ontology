# WO-CI5 — Typecheck installs each dependency once

status: **open — current release blocker**
assignee: builder
depends: WO-CI4 candidate `8ef6d20`
blocks: CI3/CI4 canonical PASS · WO-107c verification
kind: off-ladder cold-verifier correction

## Objective

Remove the peer-bus package's redundant nested installer and make the typecheck gate reject package
manager installs hidden inside lifecycle scripts before a cold verifier can execute them.

## In plain terms

QuantFlow's release check installs the Kernel correctly, then an old peer-bus setup hook tries to
install it again and crashes; remove the duplicate work and prevent it from returning.

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

## Ruling

1. Delete only the `postinstall` script from `tools/qf-peer-bus/package.json`. Preserve its harness,
   typecheck, and founder-seat scripts.
2. Before any typecheck install begins, inspect `preinstall`, `install`, and `postinstall` for every
   package in the typecheck install closure. Reject a lifecycle command that invokes:
   `bun install`, `npm install`, `npm ci`, `pnpm install`, or `yarn install`, including after `cd`,
   shell chaining, or surrounding arguments.
3. The rejection names the package path, lifecycle key, and matched command. Native rebuild or
   non-package-manager lifecycle scripts outside this exact rule are not changed by this order.
4. Add an install-free `QF_TYPECHECK_FALSIFY_RECURSIVE_INSTALL=1` path that injects the removed
   peer-bus command into the manifest value in memory. It must fail before the first `Bun.spawn`.
   Without the selector, no fake manifest or behavior exists.
5. Do not retry failed installs, change temp paths, add dependencies, or weaken frozen installs.
   The fix is one install owner, not a retry or environment workaround.

## Deliverables

- `tools/qf-peer-bus/package.json` — remove the redundant postinstall.
- `qa/run.ts` — lifecycle scanner wired before the typecheck install loop plus its install-free
  falsification selector.
- Regenerate `tools/qf-peer-bus/bun.lock` only if frozen Bun reports real manifest drift; do not edit
  it by hand.

## Acceptance

### Builder

From the isolated candidate:

```bash
QF_TYPECHECK_FALSIFY_RECURSIVE_INSTALL=1 bun qa/run.ts typecheck
bun qa/run.ts typecheck
bun qa/run.ts kernel
```

The selector exits nonzero before any install and names the injected peer-bus postinstall. Exact
restore (selector absent) passes typecheck in one run. Kernel remains green. Run the standing static
gates and `git diff --check`; do not run the canonical release verifier.

### Independent verifier

From a fresh detached clone with no `node_modules`:

1. Repeat the selector red before install.
2. Run `bun qa/run.ts typecheck` exactly once; it must pass from the genuinely cold clone.
3. Confirm `tools/qf-peer-bus` has no lifecycle package-manager install and Kernel still passes.
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
