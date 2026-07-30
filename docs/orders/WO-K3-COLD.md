# WO-K3-COLD — K3 gates install the local package that owns their imports

status: done — launcher repair independently verified at `80eb866`; merged with WO-K3
assignee: builder (Cursor Composer 2.5)
depends: WO-K3 candidate `b0b7bc5`
blocks: WO-K3 merge · WO-CI2
kind: off-ladder cold-state correction

## Objective

Make both WO-K3 gates install and run from their own launch command without borrowing a local
package install from an earlier QA gate.

## In plain terms

The new safety checks only pass after another check secretly prepares the Kernel package; run alone
on a clean machine, both crash before testing anything.

## Measured failure and rejected remedy

Fresh detached worktree at `b0b7bc5`, no package installs:

```text
bun qa/run.ts kernel-drift
bun install ... exit 0
error: Cannot find package 'qf-kernel-schema' from packages/qf-kernel/src/execute.ts
FAIL  kernel-drift
```

```text
bun qa/run.ts artifact-root
bun install ... exit 0
error: Cannot find module 'qf-kernel-schema/commands' from packages/qf-kernel/src/create.ts
FAIL  artifact-root
```

The first order version added `qf-kernel-schema` directly to both gate packages. Cursor produced the
exact four-file diff at `badb2c3`; independent verification rejected it. Bun 1.3.14 installed both
dependencies under the gate root, but the local `qf-kernel` package exposes symlinked source files,
so Bun resolved imports from `packages/qf-kernel/src/*` and searched from that package root. The same
missing-module error remained.

Measured control in a fresh worktree:

```text
cd packages/qf-kernel && bun install --frozen-lockfile
# qf-kernel-schema@../../qf-kernel-schema installed at the package that imports it
cd ../.. && bun qa/run.ts kernel-drift
PASS  kernel-drift
```

The repair therefore belongs in each cold launcher, not either gate manifest.

## Ruling — install the importing package first, and couple the plan

Each launcher owns an explicit two-step frozen install plan:

1. `packages/qf-kernel`
2. its own gate package (`qa/gates/kernel-drift` or `qa/gates/artifact-root`)

Then it launches the existing `run.ts`. Any failed install is named and stops the gate. Export the
pure install-plan construction so the package gate can assert both ordered entries even when an
earlier full-suite step has left ambient dependencies present.

Add a production-plan falsification selector such as `QF_K3_COLD_INSTALL_FALSIFY`. Both launchers
recognize the complete accepted set `kernel-drift | artifact-root`; the selected launcher removes
its `qf-kernel` entry while the other launcher stays unchanged. Unknown non-empty values fail closed.
The selected launcher validates and rejects the missing entry by name **before any install or
Kernel-dependent import can run**. This mutates the real preparation plan; a flag that merely exits
1 is forbidden.

## Deliverables

1. `qa/gates/kernel-drift.ts` builds and validates the exact two-entry plan before installing it,
   exports both operations, and names any missing/wrong/path/failed step.
2. `qa/gates/artifact-root.ts` does the same for its own gate directory.
3. `qa/gates/kernel-drift/run.ts` independently derives and asserts the imported live plan's exact
   names, order, and resolved cwd paths (`packages/qf-kernel`, then `qa/gates/kernel-drift`) before
   running semantic checks. This warm-path coupling catches launcher drift inside the full suite.
4. `qa/gates/artifact-root/run.ts` independently asserts the equivalent exact paths for
   `packages/qf-kernel`, then `qa/gates/artifact-root`.
5. No package manifest or lockfile changes. The rejected `badb2c3` diff does not land.

## Contract

- Use the committed `packages/qf-kernel/bun.lock` and each gate's committed lock with
  `bun install --frozen-lockfile`; no root install, hoist assumption, workspace declaration, copied
  source, new dependency, postinstall, fallback resolver, or alternate package manager.
- The pure plan describes what the launcher actually executes; do not maintain a second expected
  path list in the same launcher.
- Preserve all existing K3 semantics, baits, fixtures, and output. This repair changes preparation
  and its coupling assertion only.
- Do not delete shared or local dependencies. Fresh verifier worktrees provide cold state.

## Acceptance gates

### Builder-run

1. Relevant focused tests or type checks for the two exported plans.
2. From repo root, without a prior package install:

```bash
bun qa/run.ts kernel-drift
bun qa/run.ts artifact-root
```

Both must show the Kernel-package frozen install, their own frozen install, then PASS.
3. With the now-warm worktree, falsify each real plan and prove the coupling remains red even though
dependencies exist:

```bash
QF_K3_COLD_INSTALL_FALSIFY=kernel-drift bun qa/run.ts kernel-drift
QF_K3_COLD_INSTALL_FALSIFY=artifact-root bun qa/run.ts artifact-root
```

Each must fail naming its missing `qf-kernel` plan entry. Restore the environment and rerun both
green.
4. Re-falsify one original semantic guard for each gate, restore, then green:

```bash
QF_KERNEL_DRIFT_GATE_FALSIFY=1 bun qa/run.ts kernel-drift
QF_ARTIFACT_ROOT_FALSIFY=writer bun qa/run.ts artifact-root
```

5. `git diff --check` and all standing static gates. Builder does not run the full cold verifier.

### Verifier-run

In fresh detached worktree A, invoke `kernel-drift` first and `artifact-root` second. In fresh
detached worktree B, invoke them in reverse order. Both orders must pass. In a warm verifier
worktree, independently rerun both plan baits red, restore green, and confirm the diff is exactly the
four ruled launcher/run files.

## Out of scope

- Changing Bun, manifests, lockfiles, package formats, QA ordering, or canonical release stages
- Fixing other package gates that were not measured failing
- WO-CI2 implementation, runtime packaging, Dock profiles, peer bus, product rename, or schema work

## Report back

1. One plain-language sentence.
2. Both cold first-order and reverse-order green transcripts.
3. Both plan-bait and semantic-bait red→green transcripts.
4. Exact four-file diff.
5. Static-gate results and judgment paragraph.

---

## REWORK 1 — verifier code read after `1833f8f`

The four-file scope and actual cold install passed, but the coupling proof is incomplete:

1. Both `run.ts` checks validate names/count/order but not `cwd`; a same-named wrong install root is
   green. Assert independently derived exact paths.
2. On a cold falsified run, static `qf-kernel` imports can crash before `run.ts` names the missing
   plan entry. Validate the live plan in the launcher before installs/spawn; keep `run.ts` as the
   warm full-suite coupling check.
3. Each launcher rejects the other gate's ruled selector as unknown. Both must accept the complete
   two-value selector set and mutate only when their own gate is selected.

Only the original four files may change. Preserve the already-measured cold green behavior.

---

## VERIFICATION — PASS · 2026-07-29

**Candidate:** `80eb866` (`codex/wo-k3-cold-launcher`).

**In plain terms:** both K3 safety checks now prepare everything they need when run alone on a clean
machine, and removing that preparation makes each check fail by name instead of borrowing another
check's setup.

### Cold order independence

Fresh detached worktree E, no prior installs:

```text
bun qa/run.ts kernel-drift
qf-kernel frozen install: 7 packages
kernel-drift frozen install: 8 packages
PASS  kernel-drift

bun qa/run.ts artifact-root
PASS  artifact-root
```

Fresh detached worktree F, reverse order:

```text
bun qa/run.ts artifact-root
qf-kernel frozen install: 7 packages
artifact-root frozen install: 8 packages
PASS  artifact-root

bun qa/run.ts kernel-drift
PASS  kernel-drift
```

### Plan baits and selector controls

```text
QF_K3_COLD_INSTALL_FALSIFY=kernel-drift bun qa/run.ts kernel-drift
kernel-drift: missing install plan entry: qf-kernel
FAIL  kernel-drift
EXIT=1

QF_K3_COLD_INSTALL_FALSIFY=artifact-root bun qa/run.ts artifact-root
artifact-root: missing install plan entry: qf-kernel
FAIL  artifact-root
EXIT=1
```

Each launcher's other ruled selector remained green, proving only the selected plan mutates.

### Original semantic baits preserved

```text
QF_KERNEL_DRIFT_GATE_FALSIFY=1 bun qa/run.ts kernel-drift
kernel-drift FAIL: ... bait still green (expected red)
EXIT=1

QF_ARTIFACT_ROOT_FALSIFY=writer bun qa/run.ts artifact-root
artifact-root FAIL: production writer did not create publishable bytes
EXIT=1
```

Both restored runs printed PASS. All nine standing static gates passed. The implementation commit
changes exactly the four ruled launcher/run files; no manifest, lock, schema, Kernel behavior,
Electron code, fixture, or runtime dependency changed.

### Judgment

The first direct-dependency remedy (`badb2c3`) was rejected rather than rationalized after a fresh
worktree reproduced the same missing import. The final launcher repair follows Bun's measured local
file-dependency resolution and couples exact names, order, and cwd paths in both the pre-install
launcher and the warm semantic gate. Temporary dependencies created during verification are ignored
worktree output, not committed state or application truth.
