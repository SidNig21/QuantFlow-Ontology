# WO-V2-3R — bank the native Hermes runtime prerequisite

status: done — independent verifier PASS at candidate `a530c276453bb2f390304bbcf843fd0bf0810796`; correction receipt recorded below
assignee: builder
depends: WO-NORTHSTAR-1 verifier PASS `098aa62`; preserved V2-3R product working tree
rung: R13 runtime closure before R14 Research Director
authorization: founder goal 2026-08-15; routed by `NEXT.md` after adversarial Reader PASS
rework-cycle: 1 of 1 — final cycle
builder-attempts: initial pass spent; one gate-named rework pass remains after Reader PASS

## Objective

Make the normal `bun run dev` founder path launch its production Hermes
participants from tracked native-CLI adapter assets, with no AgentOS packaging
step and no dependency on artifacts left by a gate, so the custom Hermes
Research Director can be implemented on a working ordinary-development runtime.

## In plain terms

Ryan opens the development app and its production Hermes runtime is genuinely
available. Today the test app works only because its private staging folder
already contains Hermes; the normal app says Hermes is missing. This order fixes
that prerequisite only. It does not claim that the temporary `Orchestrator`
profile is the ratified Research Director experience.

## Product fit after the north-star correction

`DOCTRINE.md` A10 makes `hermes-research-director` the stable product profile.
That identity, prompt, mission UX, governed recruiting, and visible steering
belong to R14 and are deliberately not smuggled into this already-built runtime
repair. Passing this order means the native Hermes adapter can launch from the
ordinary app. It does not mean the Research Director product slice has shipped.

## Authority and profile lock

This order passed its adversarial read in task
`01a006f7-c251-7601-a560-b70b5a09a47e`. The Builder door is open only while
`NEXT.md` names this exact file. The existing V2-3R product working tree is the
authorized implementation candidate; the Builder must inspect and preserve its
valid work rather than recreate it in another checkout.

The only profiles exercised here are the already-existing temporary definitions
`hermes-orchestrator` and `hermes-worker`. They are adapter-prerequisite smoke
fixtures, not `hermes-research-director`; no name, prompt, capability, or
mission claim about the ratified Research Director may be added or altered by
this order, and its acceptance receipt may not claim that product is shipped.

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

1. Track `species/hermes/packed/hermes.aospkg` as exactly the UTF-8 bytes for
   `QuantFlow Hermes native-TUI adapter` followed by one LF byte (`0x0A`), and
   keep `hermes.meta.json` tracked beside it. The marker has no executable
   payload.
2. Rewrite `species/hermes/scripts/pack-agent.mjs` with Node standard-library
   file/JSON operations only. It validates `launch.json` and
   `tools-allowlist.json`, writes the marker and the same metadata contract, and
   invokes no bundler, npm command, AgentOS package, or external toolchain.
   The Hermes metadata contract has exactly these keys, with no extras:
   `route`, `name`, `command`, `terminal_target`, `argv`, `peer_delivery`,
   `package`, and `tools`; `route`, `name`, `command`, `terminal_target`,
   `argv`, `peer_delivery.mode`, and `peer_delivery.runtime_profiles` are
   copied from `launch.json`, `tools` is copied from the allowlist, and
   `package` is `hermes.aospkg`.
3. Remove unused `@rivet-dev/agentos-core` and
   `@rivet-dev/agentos-toolchain` dependencies from the Hermes workspace and
   regenerate its lockfile. The post-change package manifest and lockfile must
   contain neither package name (including as a transitive lockfile entry), and
   no replacement dependency may be added.
4. Remove Hermes install/toolchain-adapter work from production runtime staging;
   run the standard-library pack script in the copied source tree, then stage
   the marker and metadata. QA-only AgentOS proof species are unchanged.
5. `bun run dev` performs no packaging, npm discovery, AgentOS discovery, or
   pack-script override on the ordinary path. Both production native CLI
   adapter markers are tracked inputs, so it proceeds directly to the existing
   Electron launcher.

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
files — exactly the two `dock-profiles.json` manifests, both species' packed
adapter files, and Claude Code's existing packed `claude-code.mjs` — to a
unique temporary resource root, mutates that copy, and deletes only that
temporary root in `finally`.

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

The pack proof also fails if either removed AgentOS package name remains in
`species/hermes/package.json` or `species/hermes/bun.lock`. The ordinary-startup
proof separately fails if `dev.mjs` or `dev.ps1` still discovers npm, AgentOS,
a pack script, or `.package-staging` on the normal path; the QA-only staging
path may retain its existing AgentOS behavior.

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

The live proof must use the existing app RPC/UI seam, not a manifest-only,
Kernel-direct, static, or mocked check: a live Electron PID, the app readiness
response, `window.shellApi.qf.listDefinitions()`, and the visible Dock launch
rows must all agree on those exact two IDs and their available status. The
reported package/resource paths must resolve under the repository root; a
`.package-staging` or synthesized package result is a failing proof.

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
git diff --exit-code b5b6c95 -- collab-electron/src/windows/shell/src/task-composition.js qa/gates/team-composition-ui.ts
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
| candidate-product-file diff | either of the two named V2-3R product files differs from candidate `b5b6c95` |
| `git diff --check` | the candidate diff contains whitespace errors or conflict markers |

The candidate-product-file diff is intentionally narrow: it compares only
`collab-electron/src/windows/shell/src/task-composition.js` and
`qa/gates/team-composition-ui.ts` with `b5b6c95`. It does not claim that every
currently dirty V2-3R runtime or order file matches that candidate; those paths
are governed by this order's scoped deliverables and the existing-checkout
constraint.

The focused gate's Hermes pack/validation proof goes red if the script contains
a forbidden import/invocation, needs an install, emits bytes different from the
tracked marker/metadata, or metadata does not match `launch.json` and
`tools-allowlist.json`. Runtime-staging tests go
red if production staging attempts a Hermes install/AgentOS toolchain or omits
either tracked adapter file.

`dev-dock-readiness` starts a monotonic timer before its first disposable
operation, fails non-zero at 120,000 ms, and prints `elapsed_ms=<value>` before
the final PASS. It must finish within two minutes and print:

```text
development_root=repository
hermes_adapter=tracked_native_tui
claude_code_adapter=tracked_native_tui
agentos_packaging_used=false
electron_process_started=true
hermes_orchestrator_launchable=true
hermes_worker_definition_launchable=true
repository_artifacts_mutated=false
elapsed_ms=<value less than 120000>
PASS dev-dock-readiness
```

The Builder pastes both falsifier reds and the restored green. A fresh
independent Verifier reruns the matrix once from the same checkout with no
tracked changes at the candidate SHA, recording `HEAD` and `git status` before
and after. A changed SHA or tracked tree voids the run. Founder direction for
this order explicitly replaces PROTOCOL's throwaway-worktree mechanism with
session separation plus this same-checkout SHA guard; no worktree or clone may
be created. No packaged installer or release matrix runs.

## Visible prerequisite acceptance

After Verifier PASS, a separate Computer Use check may open the ordinary
development app, launch the existing temporary definitions
`hermes-orchestrator` and `hermes-worker`, observe both reach `running`, close
them, and observe no remaining QuantFlow-owned Hermes process. It performs no
Task composition and makes no Research Director claim. A failure is a numbered
runtime defect; a pass accepts only the native adapter prerequisite.

## Contract

- Work only in the existing checkout and branch. No worktree, clone, helper
  framework, package gate, installer, or release verifier.
- The Kernel remains the sole truth owner. This order adds no object, link,
  action, schema change, state store, dependency, or credential access.
- Preserve candidate `b5b6c95`, the live Hermes UI proof, its falsifiers,
  cleanup, and all Task semantics and assertions. In particular,
  `collab-electron/src/windows/shell/src/task-composition.js` and
  `qa/gates/team-composition-ui.ts` remain byte-for-byte unchanged from that
  candidate; this order may change only the runtime-plumbing paths named in its
  Deliverables and the focused-gate registration.
- The normal development app must never depend on leftovers from a previous QA
  or package run.
- The two failed disposable discovery cases open no Electron window; the
  public green path starts Electron only after its untouched repository-root
  readiness checks pass.
- Delete the two unused AgentOS dependencies from `species/hermes`; add no
  dependency, vendor patch, wrapper, cache edit, or replacement package.

## Out of scope

- Repairing the Claude Code readiness-handshake timeout.
- Reconciling or retiring stale Kernel `agent_definition` rows (`DEBT.md` #35).
- Renaming or implementing `hermes-research-director`, changing its prompt or
  tools, mission planning, recruiting, task delivery, steering, or research
  judgment. Those are the next R14 product order.
- Rebuilding the Dock, cables, seat states, cross-species delivery, the long
  Windows suite, or V2-3.2.
- Changing Hermes authentication or inspecting credentials.

## Stop

Stop if the standard-library Hermes pack/validation script cannot reproduce the
tracked adapter assets, Hermes remains unavailable with those assets present,
an assertion must weaken, a new dependency/version is required, or a product
file outside the development startup, Hermes adapter workspace, runtime staging,
focused gate registration, and existing gate file must change.

## Report back

Open with what runtime prerequisite is now banked without claiming the Research
Director is shipped. Then provide the candidate SHA, changed files,
the unedited acceptance output, both falsifier reds, restored green, elapsed
time, and any remaining limit. Commit and push to `wo-V2-3`; do not merge or
rotate `NEXT.md`.

## Rework — exact visible definition identity

The first Builder pass reached the live production Dock after both falsifiers
went red correctly. Exact Kernel IDs `hermes-orchestrator` and `hermes-worker`
were present once and available, but the final visible-card receipt counted the
display label `Market Researcher`. A second valid definition,
`hermes-worker-2`, deliberately shares that label, so label cardinality cannot
identify the required card.

This final rework cycle has exactly two deliverables:

1. In `collab-electron/src/windows/shell/src/dock.js`, put the existing
   `definitionId` on every rendered definition card as the non-visible DOM
   attribute `data-definition-id`. Do not change labels, ordering, filtering,
   availability, spawn behavior, or styling.
2. In `qa/gates/dev-dock-readiness.ts`, select the two live ready Dock cards by
   the exact attributes `data-definition-id="hermes-orchestrator"` and
   `data-definition-id="hermes-worker"`. Assert exactly one of each, retain the
   existing Hermes adapter and ready-state checks, and do not count display
   labels. `hermes-worker-2` remains valid and must neither satisfy nor fail the
   `hermes-worker` receipt.

This changes only the measurement identity; it does not relax, remove, or
replace the existing pass criterion. All earlier runtime candidate work remains
preserved. Builder rework runs only:

```powershell
cd collab-electron
bun test src/windows/shell/src/dock.test.ts
cd ..
bun qa/run.ts dev-dock-readiness
git diff --check
```

The focused gate runs once. Any red stops. Full green commits and pushes all
authorized product files for one fresh independent Verifier, which runs the
full Acceptance matrix once. No other file, assertion, dependency, test, or
product behavior may change.

## Independent verifier receipt — 2026-08-15

Correction: the prior verifier report wrote `...0797`; that was a transcription
error. The delegated candidate and measured HEAD were exactly
`a530c276453bb2f390304bbcf843fd0bf0810796`. No matrix command ran and no file
changed during that earlier report.

The corrected independent verification ran the full Acceptance matrix exactly
once, in order, from the existing checkout. Baseline and post-run receipts:

- `HEAD=a530c276453bb2f390304bbcf843fd0bf0810796`
- `BRANCH=wo-V2-3`
- `STATUS_SHORT=` (clean before and after)
- `UPSTREAM=origin/wo-V2-3`
- `LOCAL_UPSTREAM_EQUAL=True`
- `ELECTRON_HERMES_PROCESS_NAMES=<none>`

Exact matrix receipts:

1. `bun test scripts/package-lib/runtime-staging.test.ts` — `2 pass`, `0 fail`.
2. `bun qa/run.ts dev-dock-readiness` — both falsifiers red, restored live proof green; `elapsed_ms=13321`; `PASS dev-dock-readiness`.
3. `bun qa/run.ts repo-shape` — `PASS repo-shape`.
4. `bun qa/run.ts kernel-sole-writer` — `PASS kernel-sole-writer`.
5. `bun qa/run.ts kernel-sole-writer-app` — `PASS kernel-sole-writer-app`.
6. `bun qa/run.ts one-skin` — `PASS one-skin`.
7. `bun qa/run.ts team-composition-ui` — live renderer/preload/main receipt; `PASS team-composition-ui`.
8. `bun qa/run.ts doc-links` — `PASS` (56 live documents, every pointer resolves).
9. `git diff --exit-code b5b6c95 -- collab-electron/src/windows/shell/src/task-composition.js qa/gates/team-composition-ui.ts` — exit 0.
10. `git diff --check` — exit 0.

The native Hermes runtime prerequisite is verified and banked. This receipt does
not claim that the Research Director product is shipped; its product order must
be drafted and independently read next.
