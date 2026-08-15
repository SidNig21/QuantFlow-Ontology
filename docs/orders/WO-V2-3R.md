# WO-V2-3R — make the ordinary development Dock launchable

status: draft-reader-required
assignee: builder
depends: WO-V2-3 candidate `b5b6c95` machine-passed and founder-rejected
rung: R13 / V2-3 founder closure
authorization: none until `NEXT.md` names this order
rework-cycle: 0 of 1

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

Before Electron starts, `bun run dev` invokes the existing Hermes and Claude
Code production pack scripts from their package roots. A missing ignored
`.aospkg` is normal clean-checkout state, not a reason to open a broken Dock.

Use the existing pack scripts; do not duplicate their packing logic, copy from
`.package-staging`, or introduce a package cache. If either pack command fails,
development startup exits nonzero before Electron opens and prints which named
adapter failed.

### B. The normal development app and the gate share one readiness floor

Add one focused gate named `dev-dock-readiness`. It starts with the two
generated adapter package outputs absent, runs the real development preflight,
and proves both packages are regenerated at their repository-root manifest
paths before app launch. It then boots the production renderer/main against an
isolated Kernel and proves the real Dock reports the Hermes Orchestrator and
Market Researcher as launchable on this founder machine.

The gate may inject process execution and temporary paths into the preflight
for its failure cases, but its green live receipt must use the real existing
pack scripts and repository-root manifests. It may not reuse
`.package-staging`, synthesize an `.aospkg`, insert an `agent_definition`
directly, mock availability, or bypass the Dock launch control.

### C. Failures remain truthful

Falsify the preflight twice:

1. Make the named Hermes pack command return nonzero. Electron must not launch,
   the command must exit nonzero, and the message must name Hermes.
2. Let a pack command report success without creating its expected `.aospkg`.
   Electron must not launch and the missing output path must be printed.

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

`dev-dock-readiness` must finish within two minutes and print:

```text
development_root=repository
hermes_package=prepared
claude_code_package=prepared
electron_started_after_packages=true
hermes_orchestrator_launchable=true
hermes_worker_launchable=true
PASS dev-dock-readiness
```

The Builder pastes both falsifier reds and the restored green. A fresh
independent Verifier reruns the matrix once from a clean tree at the candidate
SHA. No packaged installer or release matrix runs.

## Founder-delegated acceptance

After Verifier PASS, the router uses Computer Use on the normal development
app. It must:

1. launch an Hermes Orchestrator and Market Researcher from the production Dock;
2. see both reach `running`;
3. create one Task from the Orchestrator tile and assign it to the researcher;
4. see the owner on the tile and Dock;
5. reassign, cancel, close the assigned seat, close and reopen the app; and
6. see the cancelled Task, final owner, and closed seat restored.

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

Stop if the real Hermes pack script cannot complete from this checkout, Hermes
remains unavailable after its package exists, an assertion must weaken, a
dependency is required, or any product file outside the development startup,
focused gate registration, and existing gate file must change.

## Report back

Open with what Ryan can now do. Then provide the candidate SHA, changed files,
the unedited acceptance output, both falsifier reds, restored green, elapsed
time, and any remaining limit. Commit and push to `wo-V2-3`; do not merge or
rotate `NEXT.md`.
