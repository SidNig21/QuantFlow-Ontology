# WO-ACT1-GOLDEN-PATH — continuous packaged golden run

status: open
assignee: builder
depends: R0–R8 complete

## Objective

From one founder question in the packaged Windows app, run one continuous desk workflow: an
orchestrator launches a real worker, delegates a Kernel task, the worker reads the generated market
surface and returns a cited result, then the desk closes and reopens with its Kernel history intact.

## In plain terms

Typing a question must cause two app-launched agents to do one durable piece of work together. If this
is wrong, QuantFlow can look complete while no operator path reaches a trustworthy result receipt.

## Context pack

Read `START_HERE.md`, `docs/LAWS.md`, `docs/orders/PROTOCOL.md`, `docs/orders/GOLDEN-RUN.md` Part I
and R3/R5/R6/R8, and the queued founder-review files under `docs/orders/evidence/r3`, `r6`, and
`r8`. Then read these seams before editing:

- `collab-electron/src/main/index.ts`, `ontology-gateway.ts`, `agent-host.ts`,
  `host-native-tui.ts`, `native-tui-orchestration.ts`, `kernel.ts`, and `ipc-kernel.ts`
- `collab-electron/cli/qf-ontology-mcp.mjs` and `qf-collaboration-mcp.mjs`
- `qf-kernel-schema/src/ontology/agent.ts` and `research.ts`
- `packages/qf-kernel/src/create.ts`, `execute.ts`, and `links.ts`
- `tools/qf-proof-agent/`
- `qa/gates/windows-research-question.ts`, `windows-dock-hire.ts`,
  `windows-dock-collaboration.ts`, `kernel-task-delegation.ts`, and
  `kernel-market-lineage.ts`

## Contract

1. The Kernel owns truth. All mutation uses `execute()` through `kernelExecute`; renderer and peer
   bus are projections or transport.
2. Native Windows packaging is the acceptance platform. WSL or Linux does not substitute for the
   packaged Windows proof.
3. There is no new truth store. In particular, `peer-bus.db` may notify a seat but cannot be task,
   assignment, result, cable, or lineage truth.
4. Do not read, print, copy, set, or test credentials. The founder-only proof uses pre-existing
   Hermes authentication outside QuantFlow.
5. Do not weaken or remove existing gates, permissions, package isolation, or founder-state
   isolation. Do not add a dependency or service.
6. This is an Act I repair. It does not implement R9 publication or evaluation semantics, datasets,
   backtests, critics, live Bovada capture, betting, or trading.
7. The founder pressing **Submit** is the deliberate billable-run confirmation. Do not add unattended
   run confirmation, `-z`, `--yolo`, or any equivalent bypass.

## Deliverables

### 1. Explicit mission activation

`qf.research.submit_question` writes the mission first and admits the normal orchestrator. Admission
creates a one-use random readiness nonce. Each native-TUI adapter launcher must emit the exact
nonce-scoped readiness receipt only after all seat-specific environment and MCP configuration is
complete and immediately before it execs or starts the selected runtime. The app observes that
receipt on the owned PTY, consumes it as a launcher/input-boundary signal, and only then writes one
bounded instruction containing the mission id and submitted question. PTY input written after this
boundary may queue until the runtime consumes it; no claim about vendor-specific UI text is made.

The receipt has a bounded deadline. A missing, duplicate, malformed, or mismatched receipt aborts
activation, writes no instruction bytes, terminates only the owned runtime, revokes the seat token,
cleans all owned maps and role registrations, and records fail/close for that session. Fixed sleeps,
screen-text scraping, prompt-character matching, and inferred vendor readiness are forbidden. The
instruction tells the orchestrator to use only QuantFlow MCP tools, hire the named worker, delegate
the mission, and return a receipt. It is not a model prompt template, repeated retry loop, or
autonomy bypass.

The deterministic proof consumes this same activation seam; it does not call agent actions directly
through app RPC. The normal-mode founder flow uses the same seam and has `qaMode: false`.

### 2. Precreated worker admission — exact state machine

`qf_create_agent_session` remains Kernel truth: an admitted orchestrator creates one `starting`
session row with exactly one `spawned_from` link. When that orchestrator invokes
`qf_start_agent_session`, the asynchronous app-owned gateway:

1. validates the target row is still `starting` and has exactly one valid `spawned_from` link;
2. resolves the definition solely from that link, not from caller-provided profile data;
3. launches the PTY/runtime using the exact existing Kernel session id;
4. records `start_agent_session` only after PTY ownership, live-map ownership, and role delivery
   registration succeed; and
5. on any failure, terminates only owned runtime resources, removes only its owned maps and role
   registration, then records `fail_agent_session` and `close_agent_session` against that same row.

The precreated branch skips **only** `create_agent_session`; it never mints, substitutes, or creates a
second id. `ontology-gateway.ts` receives an injected admission callback from `index.ts`; it neither
opens SQLite nor synthesizes a runtime. The normal Dock path retains runtime-minted admission.

### 3. Live seat authentication at the app boundary

At admission the app mints an opaque, random, process-memory-only capability for the seat and exposes
it only in that exact seat's owned process environment, inherited by its ontology and collaboration
MCP bridge children; no other seat receives it. The capability is bound to the exact Kernel session
id, role, owned PTY/runtime, and live lifetime. It authenticates the live seat boundary against other
or stale local callers; it is not a sandbox boundary against the same seat. It is never stored
in the Kernel, peer bus, artifact payload, logs, UI, command text, or caller-controlled task/result
arguments. It is revoked before cleanup on exit, cancel, failed admission, or close.

Every ontology and collaboration JSON-RPC call must present this capability. The app verifies the
capability and current live ownership before any Kernel read/write, artifact write, or peer-bus
operation. `session_id` and `role` remain routing metadata and are never treated as credentials.
Wrong, missing, cross-seat, or revoked capabilities fail before side effects. The external packaged
gate may drive founder Submit and read diagnostics, but it may not mint or inject a seat capability;
agent actions must originate through the launched MCP bridge.

### 4. Kernel task, delegation, and canvas cable

Extend the schema with typed `task → delegated_by → agent_session` alongside existing
`task → assigned_to → agent_session`. The app-owned collaboration MCP `send_task` path creates the
Kernel task **before** notifying the worker. It takes the token-bound admitted orchestrator identity
from app context, creates the task, writes `delegated_by` to that orchestrator and `assigned_to` to
the worker atomically, then calls peer-bus delivery as notification only. Caller input cannot supply
either actor identity or arbitrary links. The app resolves the recipient from the live role binding.
The canonical task plus its `delegated_by` and `assigned_to` links are the entire assignment truth;
no task-to-delivery-receipt mapping, process map, or peer-bus truth is added.

Project the assignment cable from `task + delegated_by + assigned_to` Kernel reads. Its task title and
open/done state come from the Kernel; it must remain after app relaunch without `peer-bus.db`. Do not
use `session → delegates_to` for this feature and do not create a task-memory UI cache.

### 5. Generated market read and canonical result receipt

The worker has only `market.read`. It uses the packaged `qf-ontology-mcp.mjs` bridge over stdio to
call a generated market read; the app gateway records the actual ontology-read trajectory artifact.

Replace the Act I result surface with the existing app-owned collaboration MCP `send_result`. It
requires `task_id`, non-empty result text, `cited_market_ids`, and the actual ontology-read trajectory
artifact ids. The app validates the payload before writing: every cited id exists as a market object,
the cited ids are present in the named read trajectory results, and every named trajectory belongs to
the admitted worker. This is **app cite validation**.

The app then writes the canonical root-owned result as a `trajectory` artifact through existing
`peerBusSend` / `publish_artifact`; it binds `produces` from that worker and `derived_from` to each
actual read trajectory. It then sends the peer notification. No caller path field, artifact root
field, arbitrary storage reference, or generic publication action is added to this slice.

Extend `complete_task` so its trusted app context supplies `actor_session_id` and its action input
requires `result_artifact_id`. The Kernel validates **lineage**, not citation text: actor is the
assigned worker; the result artifact is produced by that worker; and it derives from at least one
actual ontology-read trajectory. Only then may it write `task.completed`. This is **Kernel lineage
validation**. The app validates cites; the Kernel validates the durable relationship graph.

### 6. Deterministic packaged proof — CI only

Extend `qf-proof-agent` only behind explicit QA-only golden-run mode. It visibly reports
`DETERMINISTIC PROOF` and must never be described as a model. Its process uses packaged
`qf-ontology-mcp.mjs` and `qf-collaboration-mcp.mjs` over stdio for all agent actions; direct app RPC
is permitted only to drive the founder Submit and inspect the packaged application from the external
gate harness.

Add `qa/gates/windows-golden-run.ts`, register `windows-golden-run`, and add it to the
`packaged-app` workflow. One Windows package and one app instance, with isolated HOME, Kernel,
artifact, and bus roots, must execute:

```
Submit → mission + orchestrator admission → bounded activation → worker creation/start
→ Kernel task/delegated_by/assigned_to → worker generated market read over stdio MCP
→ canonical send_result receipt + citations + lineage → Kernel completion → seat close
→ relaunch on the identical roots → independent read-only Kernel and canvas assertions
```

The gate asserts package-process cleanup before and after relaunch. It pre-seeds market rows only via
`kernelExecute` or `execute()`, never SQL, and labels them fixture data. It proves product mechanics,
not live Bovada data or model judgment. Regenerate and commit `golden/` whenever schema output
changes; never hand-edit generated files.

### 7. Founder-only normal-mode Hermes proof — not CI

Write `docs/orders/evidence/act1-golden-path/FOUNDER-REVIEW.md` with a concise packaged-app
checklist. It launches the same package with `qaMode: false`, isolated pre-seeded fixture data created
through `execute()`, and assertions that QA proof profiles are absent from the Dock/catalog and cannot
be admitted or launched. QA implementation files may be staged in the package for CI, but they must
be unreachable in normal mode. The founder submits a
benign fixture-backed question and observes `hermes-orchestrator` receive activation, hire
`hermes-worker`, create and assign the task, read the fixture market through QuantFlow MCP, return a
cited result, and show the Kernel-derived cable. The founder manually closes seats and reopens the
app.

This is a real model-backed founder demonstration over a clearly labelled fixture, not a live Bovada
claim. The founder supplies any Hermes authentication outside QuantFlow. Builders and verifiers do
not inspect it. The hash-only `hermes-founder-state` check remains applicable. A failed live run is
reported honestly; deterministic proof success never substitutes for it.

## Runtime falsification requirements

Every runtime bait must use a bounded deadline, independent ownership snapshot, and finally cleanup
that terminates only package-owned PIDs. Red runs must not inherit a green run's stores, PTYs, role
registrations, socket endpoint, or process handles. A bait that times out, leaks a process, or relies
on stale package resources is a failure, not a pass.

## Acceptance gates

### Builder-run

Run only in the builder's private worktree; do not delete any `node_modules` directory.

```powershell
Set-Location collab-electron
bun install --frozen-lockfile
bun test
Set-Location ..
bun qa/run.ts repo-shape
bun qa/run.ts kernel-sole-writer
bun qa/run.ts no-canvas-domain-writes
bun qa/run.ts kernel-sole-writer-app
```

If schema changes:

```powershell
Set-Location qf-kernel-schema
bun install --frozen-lockfile
bun test
bun run generate
```

Also run focused deterministic tests for precreated admission, trusted collaboration identities,
`delegated_by`/`assigned_to` atomicity, task completion lineage validation, Kernel-backed projection,
and malformed collaboration-MCP payload rejection.

### Verifier-run

An independent verifier uses a fresh detached Windows worktree:

```powershell
bun qa/run.ts windows-golden-run
bun qa/verify-release.ts
git diff --check
```

`windows-golden-run` must print `PASS` after all subassertions and red/green baits. Both GitHub
checks, `test` and `packaged-app`, must pass; `packaged-app` includes this new gate and every
existing packaged gate.

## Mandatory falsification transcripts

1. Corrupt or remove the precreated admission handoff. Start must fail; no duplicate or mismatched id
   may become running, and no owned PTY, process, socket, live-map, or role registration may remain.
   Restore it and show a green launch using the original id.
2. Attempt start against a non-`starting` session, a session with zero/two `spawned_from` links, or a
   definition mismatch. Each is refused before a worker becomes live and leaves no new runtime
   residue.
3. Suppress, duplicate, corrupt, or mismatch the launcher readiness receipt. The bounded activation
   must fail with zero instruction bytes written and no owned runtime, token, map, socket, or role
   residue. Restore the exact nonce receipt and show activation green without a fixed sleep.
4. Call ontology and collaboration RPC with a missing, wrong, cross-seat, or revoked capability while
   supplying an otherwise valid session id and role. Each must fail before any Kernel, artifact, or
   peer write. Restore the live seat capability and show the same MCP call green. The transcript must
   redact the capability value.
5. Remove `delegated_by` or `assigned_to`. The Kernel/canvas assertion must go red. Restore it and
   show the task-labelled cable and relaunch persistence green.
6. Send a result as an unassigned actor, with another worker's result artifact, or without a real
   read trajectory. `complete_task` must refuse and write no completion event. Restore it and show
   the assigned worker completing the task.
7. Supply fabricated cite ids, cite ids absent from a named read trajectory, a foreign trajectory id,
   empty result text, missing task id, or malicious extra fields. App cite validation or MCP shape
   validation must refuse before result publication; no caller path/root/storage fields are accepted.
8. Break result `derived_from` or `produces` linkage. Kernel lineage validation must refuse task
   completion; restore it and show green.
9. Close and reopen after the completed deterministic task. If mission, task, links, result lineage,
   or cable lives only in UI or peer-bus state, relaunch must go red. Restore it and show the same
   Kernel-backed records and projection green.
10. In packaged normal mode, assert QA proof profiles are absent from the Dock/catalog and attempts
    to admit or launch their definitions are refused even though CI support files are staged. Any
    visible or launchable QA profile is red; hidden and unlaunchable is green. No live-data assertion
    is allowed.

## Out of scope

R9–R14; report publication/evaluation logic; datasets, backtests, critics, or metrics; live Bovada
capture; prompt/model-quality claims; model auto-close policy; new canvas persistence formats;
Claude parity; installer signing; and visual redesign beyond the Kernel-derived assignment projection
needed for this workflow.

## Stop conditions

Stop and report if the path needs a new dependency, credential, service, schema promotion, direct SQL
write, UI or peer-bus truth store, public publish, or a decision to place or trade. After two failed
rework cycles, return the order for a rewrite. Do not start R9 until the founder accepts the repaired
golden run and `NEXT.md` is rewritten by the verifier.

## Report back

1. One plain-language outcome sentence.
2. Commit SHA, changed files, and the responsibility of each changed seam.
3. For every deliverable: command, unedited output, and observed Kernel rows, links, MCP receipts,
   and packaged process evidence.
4. For every bait: how it was broken, red output, restoration, and green output.
5. State separately whether deterministic packaged proof passed and that the founder-only live-model
   proof was not run by the builder.
6. Known limits and judgment calls.
