# Builder evidence — pre-R18 coherence

Date: 2026-08-23
Branch: `wo-pre-r18-coherence`
Product candidate: `d91eda8` (`feat(pre-r18): align participant and research-world surfaces`)
Documentation correction: `80666e8` (`docs(pre-r18): correct Atlas and mouse-first authority`)
Documentation whitespace follow-up: `7de630b` (`docs(pre-r18): normalize receipt whitespace`)

## Scope

The bounded participant/research-world coherence correction was implemented. The
documentation correction and product UI candidate remain separate commits. No
R18 work, Kernel action/schema/ontology change, Claude Design reopening,
release/package work, or assertion weakening was performed.

## Required Builder matrix

The named commands were run in order.

| Command | Result |
|---|---|
| `Push-Location collab-electron; bun install --frozen-lockfile; bun test; bunx tsc --noEmit; Pop-Location` | install passed; package-wide `bun test` exited 1; `bunx tsc --noEmit` exited 0 |
| `bun qa/run.ts pre-r18-coherence` | PASS |
| `bun qa/run.ts research-world-visible` | PASS |
| `bun qa/run.ts repo-shape` | PASS |
| `bun qa/run.ts lockfile-committed` | PASS |
| `bun qa/run.ts kernel-sole-writer` | PASS |
| `bun qa/run.ts no-canvas-domain-writes` | PASS |
| `bun qa/run.ts kernel-sole-writer-app` | PASS |
| `bun qa/run.ts doc-action-surface` | PASS |
| `bun qa/run.ts one-skin` | PASS — `hex=0 func-color=0 raw-font-family=0` outside tokens |
| `bun qa/run.ts rung-ladder` | PASS — 22 rungs; active R18; complete 19 |
| `bun qf-atlas/generate.mjs` | PASS — 439 files, 110 subsystems, 126 IPC channels |
| `bun qf-atlas/generate.mjs --check` | PASS — 439 files, 126 channels, 13 strip candidates |
| `bun qf-atlas/ratchet.mjs` | PASS — 3 baseline entries, HARD RED 0, unexplained coverage 0 |
| `bun qf-atlas/generate.mjs --diff 4d25fa3df91964fc90223a135d8969ebd61c5374` | PASS — UNCHANGED; added 0, newly-detected 0, resolved 0, regressed 0 |
| `bun qa/run.ts doc-links` | PASS — 73 live documents, every pointer resolves |
| `git diff --check 4d25fa3df91964fc90223a135d8969ebd61c5374..HEAD` | PASS |
| `git diff --check` | PASS |

The package-wide test result is recorded honestly: 529 tests across 81 files,
487 passed, 42 failed, and 8 errors. The failures are unrelated existing or
environment-sensitive areas (Hermes wrapper expectations, packaged launch
founder configuration, package-inspect resource fixtures, Windows `ls` path
assumption, governed-review/native exports, Electron mock exports, tmux/PTTY
sidecar fixtures, shared image extensions, and canvas viewport/panel-manager
DOM setup). The focused product suite passed: 25 tests, 0 failures, 173
expectations. TypeScript passed with exit 0.

## Live control receipt

`pre-r18-coherence` exercised the production renderer → preload → Main → Kernel
projection → DOM path.

```text
build_once_ms=53224 build_exit=0
forced_failure_phase=spawned_not_ready
forced-failure shutdown_requested=false owned_processes_remaining=0
forced_timeout_phase=spawned_not_ready
forced-timeout shutdown_requested=false owned_processes_remaining=0
cleanup_preflight_ms=11830 forced_roots_remaining=0
pointer_tiles=10 inspect=10 collapse=10
oracle_tiles=13 oracle_cables=15 dom_tiles=13 dom_cables=15
first-launch shutdown_requested=true owned_processes_remaining=0
first_world_stage_ms=27298
roots_created=3 roots_remaining=0 retried=0 leaked=[]
primary_failure=null
cleanup_failures=[]
launch_attempts=3 ready_launches=1 active_launches=0 max_concurrent_launches=1
```

Named production-boundary receipts:

```text
renderer_submission=PASS boundary=qf.research.submit_question
preload_ipc=PASS boundary=qf:research-world:projection
main_handler=PASS boundary=read-only projection handler
kernel_projection=PASS independent Mission/session/Task/Artifact/Evaluation/Report/link comparison
dom=PASS production research tiles and cables observed
cleanup=clean
```

The standalone `research-world-visible` control also passed with
`build_once_ms=55886`, `oracle_tiles=13 oracle_cables=15`,
`dom_tiles=13 dom_cables=15`, `roots_created=3 roots_remaining=0`,
`leaked=[]`, and `cleanup_failures=[]`.

## C01–C14 positive receipts

All conditions passed in the live coherence gate:

```text
C01 durable Mission preserves landing state
C02 exact Director and ordinary participant task precedence
C03 Dock and Canvas share four participant axes
C04 raw Artifact is not current authority
C05 Evaluation and current Report markers
C06 single current Report and historical superseded Report
C07 five Dock modes have one selected primary pane
C08 identity selects and explicit session action is labeled
C09 mouse-focused terminal and Canvas focus return
C10 relaunch restores the durable Mission-local projection
C11 pre-admission refusal leaves the prior Canvas unchanged
C12 participant context is complete and honest
C13 cables retain kind direction and visual state
C14 literal oracle density and geometry remain coherent
```

## C01–C14 falsifier receipts

Each falsifier was run independently with
`QF_PRE_R18_COHERENCE_FALSIFY=Cxx`. Every command exited 1 and emitted the
required named red condition:

```text
C01 condition=durable Mission preserves landing state
C02 condition=exact Director and ordinary participant task precedence
C03 condition=Dock and Canvas share four participant axes
C04 condition=raw Artifact is not current authority
C05 condition=Evaluation and current Report markers
C06 condition=single current Report and historical superseded Report
C07 condition=five Dock modes have one selected primary pane
C08 condition=identity selects and explicit session action is labeled
C09 condition=mouse-focused terminal and Canvas focus return
C10 condition=relaunch restores the durable Mission-local projection
C11 condition=pre-admission refusal leaves the prior Canvas unchanged
C12 condition=participant context is complete and honest
C13 condition=cables retain kind direction and visual state
C14 condition=literal oracle density and geometry remain coherent
```

## Atlas and visual evidence

The Atlas projection is current at 439 files, 126 channels, 113 live wires, 0
unreached wires, 13 unused channels, 0 DEAD channels, 6/8 healthy legacy
loops, 13 strip candidates, 10 confirmed violations, 3 gray items, and 22
coverage gaps. Ratchet reported HARD RED 0 and unexplained coverage 0. The
diff from `4d25fa3df91964fc90223a135d8969ebd61c5374` is `UNCHANGED` with no
architectural change.

The visual proof is the production DOM receipt above plus the literal
13-tile/15-cable oracle retained by `research-world-visible`; no screenshot
file was added or substituted for the live DOM gate.

## Handoff

The candidate is ready only with the package-wide test limitation stated above;
the bounded coherence and all named falsifiers are recorded. The final
immutable pushed SHA is reported in the task handoff after the evidence and
generated Atlas files are committed.
