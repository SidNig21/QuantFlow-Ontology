# WO-CI5 verification evidence

## Plain-language result

The duplicate package installers are gone, and a fresh checkout now completes the strict type check
on its first run; the final packaged-app proof still awaits one outside-sandbox verifier run.

## Candidate

- implementation: `eb4545b`
- authority amendment: `c487fb4`
- branch: `codex/wo-ci4-rw`
- changed implementation files: `qa/run.ts`, `tools/qf-peer-bus/package.json`,
  `tools/qf-read-tools/package.json`
- lockfiles: unchanged

## Independent cold proof

Fresh detached clone: `/tmp/qf-ci5-verify.2xTjQ6/repo`, with no `node_modules` before the proof.

All three install-free selectors exited `1` before creating `node_modules`:

```text
literal: package=tools/qf-peer-bus lifecycle=postinstall manager=bun operation=install command=cd x && bun install
flagged: package=tools/qf-peer-bus lifecycle=postinstall manager=bun operation=install command=bun --cwd x install --frozen-lockfile
chained: package=tools/qf-peer-bus lifecycle=postinstall manager=npm operation=ci command=echo preparing; npm --prefix x ci
```

The ordinary command was then invoked exactly once in that cold clone:

```text
$ bun qa/run.ts typecheck
PASS  typecheck
```

Kernel remained green:

```text
67 pass
0 fail
PASS  kernel
```

The five CI3 drift fixtures completed in `774.13ms`, `460.09ms`, `4.72ms`, `463.90ms`, and
`290.34ms`, each below the five-second ceiling.

Repository-wide manifest inspection after the repair found no package-manager lifecycle installer.
The remaining Electron hook is the explicitly allowed `node scripts/postinstall.mjs` control.

## Canonical environment attempt

The canonical command was invoked once in the same fresh clone with run ID
`293b1e43-eb2a-4f79-a22e-d5d34ebc09c8`. It stopped at the first Electron frozen install before any
tests or application proof:

```text
error: bun is unable to write files to tempdir: ReadOnlyFileSystem
release:install: failed with exit 1
```

A second fresh clone reproduced the same message with the targeted Electron install inside the Codex
sandbox. Two attempts to start that targeted install outside the sandbox were rejected because the
approval review timed out before process creation; neither produced repository evidence. The failed
canonical candidate was not retried. An independent verifier must run the documentation-only
successor exactly once outside the sandbox.

## Judgment

The cold typecheck result proves WO-CI5 corrected the measured recursive lifecycle defect. It does
not prove the shipped Electron application. Status therefore remains target-verified rather than
PASS until the successor's canonical verifier completes in an environment that can write Bun's
Electron install cache and temporary files.
