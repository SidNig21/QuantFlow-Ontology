# WO-CI1 — Rework round 1 builder report

The app now has one release check that cannot report success without installing cleanly, passing the
unit suites, building the shipped Electron app, and passing every ontology gate in that order.

## Why rework was required

Independent re-measurement found that the production alias repair at `d23c8ee` works, but the
verifier handbook still prescribed only `bun qa/run.ts --all`. That command never built Electron.
The project could therefore repeat the exact WO-CI1 failure mode: a green QA board beside a broken
shipped app.

## Changed files in this round

| File | Evidence-bearing purpose |
|---|---|
| `.github/workflows/ci.yml` | CI calls the canonical release verifier once. |
| `qa/verify-release.ts` | Owns frozen install → unit → production build → all QA, fail-fast. |
| `qa/gates/release-verifier.ts` | Checks the independent stage contract, CLI entrypoint, real runner behavior, CI, and verifier docs. |
| `qa/run.ts` | Registers the install-free `release-verifier` gate. |
| `AGENTS.md` | Makes the canonical command the cold-start release command. |
| `docs/orders/VERIFYING.md` | Makes independent verification use the same command as CI. |
| `docs/orders/WO-CI1.md` | Records the measured defect and strengthened D3 contract. |

No dependency, lockfile, schema, golden, Kernel, runtime behavior, or package-export changes were
made in this round. `docs/orders/PROTOCOL.md` was not changed because its own hard-stop requires
explicit operator approval; its two stale `bun qa/run.ts --all` verifier references remain for the
independent verifier/founder to rule on.

## Canonical release evidence

Command, from repo root in the WO-CI1 rework branch:

```bash
env TMPDIR=/tmp/qf-bun-tmp-ci1 \
  BUN_INSTALL_CACHE_DIR=/tmp/qf-bun-cache-ci1 \
  bun qa/verify-release.ts
```

Measured output summary:

```text
release:install  exit 0 — frozen install; qf-kernel and qf-kernel-schema installed
release:unit     exit 0 — 84 + 122 + 11 + 12 + 29 = 258 tests pass, 0 fail
release:build    exit 0 — 177 main modules, 2 preload modules, 10031 renderer modules
release:qa       exit 0 — every registered gate PASS, including release-verifier
PASS  release-verification
```

The initial sandboxed build attempt failed with `spawnSync /bin/sh EPERM`; rerunning the same command
with normal process permissions produced the green transcript above. That sandbox refusal was not
counted as project evidence.

## Release-verifier bait transcript

```text
$ QF_RELEASE_VERIFIER_FALSIFY=stage bun qa/run.ts release-verifier
release-verifier: canonical release stages must be install -> unit -> production build -> all QA
release-verifier: release runner must propagate a build failure and stop before QA
FAIL  release-verifier
exit=1

$ QF_RELEASE_VERIFIER_FALSIFY=workflow bun qa/run.ts release-verifier
release-verifier: workflow must invoke bun qa/verify-release.ts
release-verifier: workflow must have exactly one run command: bun qa/verify-release.ts
FAIL  release-verifier
exit=1

$ QF_RELEASE_VERIFIER_FALSIFY=handbook bun qa/run.ts release-verifier
release-verifier: verifierHandbook must invoke bun qa/verify-release.ts
FAIL  release-verifier
exit=1

$ bun qa/run.ts release-verifier
PASS  release-verifier
exit=0
```

The production checker also calls the real runner with an injected recorder and an exit-23 build
failure. It requires every declared stage to execute in order and requires the build failure to
propagate without running QA.

## Original package-resolution gate re-falsified

```text
alias:    forbidden private alias                                      exit=1
exclude:  missing bundle exclude: qf-kernel-schema                     exit=1
manifest: qf-kernel manifest must export "./portable" as a string path exit=1
restored: PASS schema-bundle-aliases                                    exit=0
```

Manual production-config search still finds `qf-kernel*` only in the two bundle excludes, never in
`main.resolve.alias`. Live manifests measured 2 Kernel exports (`./portable` present) and 8 schema
exports (`.` plus 7 string subpaths).

## Independent read-only review

Cursor CLI Composer 2.5 found an initial runner-coverage hole, a possible Bun interpreter split, and
a stale handbook sentence. Those were corrected before the final release run. Its second read-only
review reported `NO HIGH OR MEDIUM FINDINGS`. This review is supporting testimony, not independent
verification and not a PASS decision.

## Judgment exercised

The expected stage table is intentionally independent from the live table. It is the gate's oracle:
removing build from the live release sequence must not automatically update the expected contract.
The runner prepends the current Bun executable directory to child `PATH`, so shell scripts use the
same Bun interpreter as install and build.

## Verifier deferral

The builder has rerun the full release chain and falsified both WO-CI1 gates, but does not mark this
order passed. A different seat must verify the committed branch cold, inspect the seams, and decide
PASS or REWORK. No merge to `main` is authorized by this report.
