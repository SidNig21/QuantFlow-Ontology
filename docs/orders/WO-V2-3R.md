# WO-V2-3R — make the ordinary development Dock launchable

status: paused-by-founder-direction-reset
assignee: builder
depends: WO-V2-3 candidate `b5b6c95` machine-passed and founder-rejected
rung: R13 / V2-3 founder closure
authorization: founder direction 2026-08-15 — production Hermes is native CLI; remove obsolete AgentOS packaging seam
rework-cycle: 0 of 1
builder-attempts: prior packaging premise retired; rewritten implementation gets one Builder pass

## Objective

Make the normal `bun run dev` founder path launch its production Hermes
participants from tracked native-CLI adapter assets, with no AgentOS packaging
step and no dependency on artifacts left by a gate.

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
- `species/hermes/packed/hermes.aospkg` was generated and intentionally ignored,
  even though native-TUI launch uses only its identity plus sibling metadata.
- `collab-electron/scripts/dev.mjs` correctly launches Electron directly; the
  missing tracked Hermes marker made that clean path appear unavailable.

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

### A. Production Hermes has no AgentOS packaging dependency

Hermes launches through `route: native_tui`; the `.aospkg` is an adapter identity
marker and its bytes are never executed. Make that contract explicit and match
the already-shipped Claude Code native-TUI adapter:

1. Track `species/hermes/packed/hermes.aospkg` as a small non-empty QuantFlow
   marker and keep `hermes.meta.json` tracked beside it.
2. Rewrite `species/hermes/scripts/pack-agent.mjs` with Node standard-library
   file/JSON operations only. It validates `launch.json` and
   `tools-allowlist.json`, writes the marker and the same metadata contract, and
   invokes no bundler, npm command, AgentOS package, or external toolchain.
3. Remove unused `@rivet-dev/agentos-core` and
   `@rivet-dev/agentos-toolchain` dependencies from the Hermes workspace and
   regenerate its lockfile. Do not add a replacement dependency.
4. Remove Hermes install/toolchain-adapter work from production runtime staging;
   run the standard-library pack script in the copied source tree, then stage
   the marker and metadata. QA-only AgentOS proof species are unchanged.
5. `bun run dev` performs no packaging or npm discovery. Both production native
   CLI adapter markers are tracked inputs, so it proceeds directly to the
   existing Electron launcher.

The prior `npm ENOENT` and `.cmd EINVAL` receipts prove the removed seam was not
portable. Do not patch, upgrade, wrap, or invoke AgentOS to repair production
Hermes. This order does not remove the separate QA-only `agentos` runtime proof
route from the application.

### B. The normal development app and the gate share one readiness floor

Add one focused gate named `dev-dock-readiness`. It executes the public
`bun run dev` entrypoint from `collab-electron`; calling an internal preflight
directly is not acceptance. On the green path the real Electron process must
start, reach its
production renderer/main Dock, expose its process identifier to the gate, and
be closed by the gate after the launchability assertions. A spawn request alone
is not acceptance.

The gate never moves, removes, or rewrites repository artifacts. For its red
cases it copies only the two production species manifests and packed adapter
files to a unique temporary resource root, mutates that copy, and deletes only
that temporary root in `finally`.

The gate calls `discoverDockProfileManifests(temporaryRoot)` directly for both
red cases; it does not redirect or launch the development app against that
root. The public `bun run dev` entrypoint is used only for the green proof and
always resolves the untouched repository root.

In a second unique temporary directory, the gate copies the minimum Hermes
inputs (`launch.json`, `tools-allowlist.json`, and `scripts/pack-agent.mjs`),
runs the copied script there, and compares the generated marker and metadata
byte-for-byte with the tracked repository files. It reads the script source and
fails if it imports or invokes `child_process`, `Bun.spawn`, `npm`,
`agentos`, or any non-`node:` package. The repository script is never executed
in place by the gate or Builder.

The green run proves both tracked adapter markers and metadata files are
non-empty before the Electron child starts. The same real
Electron child boots its production renderer/main against an isolated Kernel;
the gate proves that process is alive and its real Dock reports the Hermes
Orchestrator and the Hermes Market Researcher as launchable on this founder
machine. Those assertions mean exactly one row for definition
`hermes-orchestrator` and exactly one row for definition `hermes-worker`;
`hermes-worker-2` and any same-label row are not substitutes and need not be
launched by this order. Cleanup runs only after that assertion and real Electron
cleanup complete.

Its green receipt must use the real tracked repository-root adapter files and
Electron child. It may not reuse
`.package-staging`, synthesize an `.aospkg`, insert an `agent_definition`
directly, mock availability, or bypass the Dock launch control.

### C. Failures remain truthful

Falsify readiness twice in the temporary resource root:

1. Remove only the copied Hermes marker. Dock discovery must report the exact
   missing runtime-package reason and register no Hermes definitions.
2. Restore the copied marker and change only copied Hermes metadata to claim
   `route: agentos`. The native-TUI production-profile check must reject it and
   register no Hermes definitions.

Restore both conditions in the disposable copy and show the same focused gate
green against the untouched repository root. Existing
readiness checks for missing WSL, missing runtime command, or unsupported
platform remain unchanged.

## Acceptance

Builder runs, in order:

```powershell
cd collab-electron
bun test scripts/package-lib/runtime-staging.test.ts
cd ..
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

The focused gate's Hermes pack/validation proof goes red if the script contains
a forbidden import/invocation, needs an install, emits bytes different from the
tracked marker/metadata, or metadata does not match `launch.json` and
`tools-allowlist.json`. Runtime-staging tests go
red if production staging attempts a Hermes install/AgentOS toolchain or omits
either tracked adapter file.

`dev-dock-readiness` must finish within two minutes and print:

```text
development_root=repository
hermes_adapter=tracked_native_tui
claude_code_adapter=tracked_native_tui
agentos_packaging_used=false
electron_process_started=true
hermes_orchestrator_launchable=true
hermes_worker_definition_launchable=true
repository_artifacts_mutated=false
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
- Delete the two unused AgentOS dependencies from `species/hermes`; add no
  dependency, vendor patch, wrapper, cache edit, or replacement package.

## Out of scope

- Repairing the Claude Code readiness-handshake timeout.
- Reconciling or retiring stale Kernel `agent_definition` rows (`DEBT.md` #35).
- Rebuilding the Dock, cables, seat states, cross-species delivery, the long
  Windows suite, V2-3.2, or the founder-direction reset.
- Changing Hermes authentication or inspecting credentials.

## Stop

Stop if the standard-library Hermes pack/validation script cannot reproduce the
tracked adapter assets, Hermes remains unavailable with those assets present,
an assertion must weaken, a new dependency/version is required, or a product
file outside the development startup, Hermes adapter workspace, runtime staging,
focused gate registration, and existing gate file must change.

## Report back

Open with what Ryan can now do. Then provide the candidate SHA, changed files,
the unedited acceptance output, both falsifier reds, restored green, elapsed
time, and any remaining limit. Commit and push to `wo-V2-3`; do not merge or
rotate `NEXT.md`.
