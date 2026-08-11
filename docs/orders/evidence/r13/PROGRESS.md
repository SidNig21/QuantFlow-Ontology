# R13 progress — 2026-08-10

status: IN PROGRESS — consumer workflow not yet accepted

## Implemented

- Research Ledger and first-run guided question in the GLACIER Dock.
- Durable question → hypothesis → dataset → deterministic run/metrics →
  independent evaluation → gated report projections.
- Native Hermes orchestrator, worker, and critic TUI admission; duplicate
  non-terminal session cards are no longer projected on the canvas.
- QuantFlow-only Hermes seats: zero bundled skills and a role-scoped ontology
  surface. The orchestrator sees five tools total (three ontology, two
  collaboration).
- Bounded mission activation, worker/result handoff, critic activation, report
  artifact presentation, recovery projections, and explicit Windows signing
  status.

## Local verification completed

- `node --import tsx src/main/r13-consumer-workflow.check.ts` — PASS.
- Focused launcher, ontology-role, and mission tests — 12 pass, 81 assertions.
- `bunx tsc --noEmit -p tsconfig.json` — PASS.
- `bun run build` — PASS.
- A real packaged Windows shell was rebuilt with the current app bundle and
  launched in normal mode for the consumer check.

## Computer Use consumer result

From the visible Ask QuantFlow box, the founder question created a durable
mission and launched a real `hermes-orchestrator` native TUI. The TUI connected
to two QuantFlow MCP servers and reported `5 tools · 0 skills`.

The remaining failure is before the first product action: after more than one
minute the model remained in its reasoning state and created no worker task.
Therefore the complete question → report → reopen workflow is **not yet
accepted**, R13 remains active, and no release-complete claim is made.

## Packaging/release state

Electron Builder again stalled while traversing the Bun dependency tree before
writing the app payload. For the consumer check only, the known-good packaged
Electron shell was combined with the current app bundle and bridge scripts.
This proves the Windows executable can launch the current product, but it is not
the final installer. The available Windows artifact is unsigned; no signing
certificate was supplied.

## Exact next step

Measure one Hermes call outside the canvas with the same isolated profile and
five-tool surface. If provider latency is healthy, repair the one-shot prompt or
turn boundary; otherwise report provider latency honestly. Then rerun the same
single Computer Use workflow through report and close/reopen before producing
the final installer.

R14/RL remains out of scope.
