# WO-V2-3R — make the ordinary development Dock launchable

status: reauthorization-required-after-two-builder-stops
assignee: builder
depends: WO-V2-3 candidate `b5b6c95` machine-passed and founder-rejected
rung: R13 / V2-3 founder closure
authorization: exhausted after two Builder stops; explicit founder exception required
rework-cycle: 0 of 1
builder-attempts: 2 of 2 used — exhausted

## Objective

Make the normal `bun run dev` founder path prepare and launch its production
Hermes participants instead of depending on package artifacts left by a gate.

## In plain terms

Ryan opens the development app, sees an available Orchestrator and Market
Researcher, launches both, and can finish the V2-3 founder check. Today the test
app works only because its private staging folder already contains Hermes;
the normal app says Hermes is missing and cannot compose a team.

## Measured rejection

Candidate `b5b6c950a8269fe448c1db9cbe47aaee65238689` independently passed
`team-composition-ui` against `collab-electron/.package-staging`. The founder
delegated the visible acceptance check to Computer Use. The ordinary app was
started exactly as the order requires:

```powershell
cd collab-electron
bun run dev
```

Visible receipt:

```text
0 live · 9 closed · 2 launchable
Orchestrator — Hermes — Team composition — UNAVAILABLE
runtime package missing: species/hermes/packed/hermes.aospkg

Claude Code Team composition:
ready → STARTING → FAILED — RETRY
native-TUI launcher readiness handshake timed out
```

Read-only trace:

- `qa/gates/team-composition-ui.ts` sets its resource root to
  `collab-electron/.package-staging`, which contains `hermes.aospkg`.
- Development `appRoot()` resolves to the repository root.
- `species/hermes/packed/hermes.aospkg` is generated and intentionally ignored.
- `collab-electron/scripts/dev.mjs` and `dev.ps1` launch Electron without
  running the existing production adapter pack scripts.

The green machine proof and red founder proof therefore used different package
readiness floors.

## Context pack

Read only:

- `START_HERE.md`
- `docs/orders/PROTOCOL.md`
- this order
- `collab-electron/scripts/dev.mjs`
- `collab-electron/scripts/dev.ps1`
- `species/hermes/scripts/pack-agent.mjs`
- `species/claude-code/scripts/pack-agent.mjs`
- `collab-electron/src/main/app-root.ts`
- `collab-electron/src/main/dock-profiles.ts`

## Deliverables

### A. Development startup owns its production Dock packages

On every invocation, before Electron starts, `bun run dev` runs these two
commands in this order, even when outputs already exist:

```powershell
bun species/hermes/scripts/pack-agent.mjs
bun species/claude-code/scripts/pack-agent.mjs
```

They run from the repository root and must produce, respectively:

```text
species/hermes/packed/hermes.aospkg
species/claude-code/packed/claude-code.aospkg
```

Measured during the first Builder attempt, the unmodified Hermes script reaches
the bundled AgentOS toolchain, which selects the extensionless Windows file
`C:\Program Files\nodejs\npm` and fails with `spawnSync ... npm ENOENT`. The
same toolchain already defines `AGENTOS_TOOLCHAIN_NPM` as its executable
override, and `npm.cmd` is present on `PATH`. A second Builder attempt proved
that the toolchain rejects the bare value `npm.cmd`: its resolver accepts the
override only when `existsSync(value)` is true, then falls back to the broken
extensionless file.

On Windows only, development startup must resolve `npm.cmd` to the first
absolute existing file found by scanning the current `PATH` entries in order,
then pass that absolute path as `AGENTOS_TOOLCHAIN_NPM` to the real Hermes pack
child unless the caller already supplied an absolute existing override. If no
absolute existing `npm.cmd` is found, startup fails closed before packing and
prints `Hermes pack failed: npm.cmd not found on PATH`. A bare command name is
not acceptance. This is the only proposed resolution after reauthorization: do
not edit the Hermes pack script, bundled toolchain, dependencies, or machine
installation. The focused green and founder paths both enter through this
development-startup environment.

A missing ignored `.aospkg` is normal clean-checkout state, not a reason to
open a broken Dock. There is no staleness check or cache reuse in this order.

Use the existing pack scripts; do not duplicate their packing logic, copy from
`.package-staging`, or introduce a package cache. If either pack command fails,
development startup exits nonzero before Electron opens and prints which named
adapter failed.

### B. The normal development app and the gate share one readiness floor

Add one focused gate named `dev-dock-readiness`. It executes the public
`bun run dev` entrypoint from `collab-electron`; calling an internal preflight
directly is not acceptance. On the green path it substitutes neither pack
command nor the Electron child: the real Electron process must start, reach its
production renderer/main Dock, expose its process identifier to the gate, and
be closed by the gate after the launchability assertions. A spawn request alone
is not acceptance.

Before that green run, the gate moves these complete generated directories to
a unique temporary backup outside the repository, if they exist:

```text
species/hermes/agent-package/dist
species/hermes/packed
species/claude-code/packed
```

It records a byte hash for every backed-up file. In a `finally` path, it removes
only artifacts created by the gate, restores the three directories exactly,
and proves the restored file list and hashes equal the pre-run list and hashes.
If no directory existed before the run, the `finally` path leaves it absent.
The gate must refuse to start if its unique backup path already exists. No
unbacked deletion, overwrite, or cleanup of a pre-existing artifact is allowed.

The green run proves both packages are regenerated at the two repository-root
paths named in Deliverable A before the Electron child starts. The same real
Electron child boots its production renderer/main against an isolated Kernel;
the gate proves that process is alive and its real Dock reports the Hermes
Orchestrator and the Hermes Market Researcher as launchable on this founder
machine. Those assertions mean exactly one row for definition
`hermes-orchestrator` and exactly one row for definition `hermes-worker`;
`hermes-worker-2` and any same-label row are not substitutes and need not be
launched by this order. Restoration runs only after that assertion and real
Electron cleanup complete.

The gate may inject process execution and temporary paths into the public dev
entrypoint only for its two failure cases. Its green receipt must use the real
existing pack scripts, repository-root manifests, and Electron child. It may
not reuse
`.package-staging`, synthesize an `.aospkg`, insert an `agent_definition`
directly, mock availability, or bypass the Dock launch control.

### C. Failures remain truthful

Falsify the preflight twice:

1. Substitute the Hermes command only and make it return nonzero. The Claude
   Code command and Electron child must not run, the dev command must exit
   nonzero, and stderr must contain `Hermes pack failed`.
2. Let the real Hermes command complete, substitute the Claude Code command so
   it returns zero without creating
   `species/claude-code/packed/claude-code.aospkg`, and remove that expected
   output only inside the safely backed-up gate interval. The Electron child
   must not run, the dev command must exit nonzero, and stderr must print that
   exact missing path.

Restore both conditions and show the same focused gate green. Existing
readiness checks for missing WSL, missing runtime command, or unsupported
platform remain unchanged.

## Acceptance

Builder runs, in order:

```powershell
bun qa/run.ts dev-dock-readiness
bun qa/run.ts repo-shape
bun qa/run.ts kernel-sole-writer
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts one-skin
bun qa/run.ts team-composition-ui
bun qa/run.ts doc-links
git diff --check
```

The existing gates are regression guards, not substitutes for
`dev-dock-readiness`. Their existing assertions are unchanged and must go red
under these concrete breaks:

| Gate | Retained red condition |
|---|---|
| `repo-shape` | a required repository path is absent or appears in a forbidden location |
| `kernel-sole-writer` | a non-Kernel source writes Kernel-owned truth |
| `kernel-sole-writer-app` | an application source writes Kernel-owned truth outside the approved boundary |
| `one-skin` | a second renderer skin or forbidden legacy UI surface appears |
| `team-composition-ui` | its existing renderer-to-preload-to-main-to-isolated-Kernel Task and launch assertions fail; its `.package-staging` fixture is supplemental and does not prove development-package readiness |
| `doc-links` | an in-scope documentation link resolves to no tracked target |
| `git diff --check` | the candidate diff contains whitespace errors or conflict markers |

`dev-dock-readiness` must finish within two minutes and print:

```text
development_root=repository
hermes_package=prepared
claude_code_package=prepared
electron_process_started_after_packages=true
hermes_orchestrator_launchable=true
hermes_worker_definition_launchable=true
preexisting_artifacts_restored=true
PASS dev-dock-readiness
```

The Builder pastes both falsifier reds and the restored green. A fresh
independent Verifier reruns the matrix once from the same checkout with no
tracked changes at the candidate SHA, recording `HEAD` and `git status` before
and after. A changed SHA or tracked tree voids the run. Founder direction for
this order explicitly replaces PROTOCOL's throwaway-worktree mechanism with
session separation plus this same-checkout SHA guard; no worktree or clone may
be created. No packaged installer or release matrix runs.

## Founder-delegated acceptance

After Verifier PASS, the router uses Computer Use on the normal development
app. It must:

1. launch exactly definitions `hermes-orchestrator` and `hermes-worker` from
   the production Dock; their visible roles are `Orchestrator` and
   `Market Researcher`, respectively;
2. see both reach `running`;
3. create one Task from the Orchestrator tile, assign it to the running Hermes
   `hermes-worker`, and see `hermes-worker` as owner on both the Task tile and
   Dock row;
4. reassign that same Task to the running Hermes Orchestrator and see the
   Orchestrator as owner on both surfaces;
5. cancel that Task, close the `hermes-worker` seat, and see the Task remain
   cancelled with `hermes-orchestrator` as final owner;
6. close and reopen the app; and
7. see the cancelled Task, `hermes-orchestrator` final owner, and closed
   `hermes-worker` seat restored.

That visible sequence accepts V2-3.1. Machine green alone does not.

## Contract

- Work only in the existing checkout and branch. No worktree, clone, helper
  framework, package gate, installer, or release verifier.
- The Kernel remains the sole truth owner. This order adds no object, link,
  action, schema change, state store, dependency, or credential access.
- Preserve candidate `b5b6c95`, the live Hermes UI proof, its falsifiers,
  cleanup, and all Task semantics and assertions.
- The normal development app must never depend on leftovers from a previous QA
  or package run.
- A failed preflight opens no Electron window.

## Out of scope

- Repairing the Claude Code readiness-handshake timeout.
- Reconciling or retiring stale Kernel `agent_definition` rows (`DEBT.md` #35).
- Rebuilding the Dock, cables, seat states, cross-species delivery, the long
  Windows suite, V2-3.2, or the founder-direction reset.
- Changing Hermes authentication or inspecting credentials.

## Stop

Stop if the real Hermes pack script cannot complete when invoked by development
startup with the Windows toolchain override above, Hermes remains unavailable
after its package exists, an assertion must weaken, a dependency is required,
or any product file outside the development startup, focused gate registration,
and existing gate file must change.

## Report back

Open with what Ryan can now do. Then provide the candidate SHA, changed files,
the unedited acceptance output, both falsifier reds, restored green, elapsed
time, and any remaining limit. Commit and push to `wo-V2-3`; do not merge or
rotate `NEXT.md`.
