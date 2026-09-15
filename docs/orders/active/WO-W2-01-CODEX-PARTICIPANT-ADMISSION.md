# WO-W2-01 — Admit Codex as a real QuantFlow participant

status: OPEN — founder-specified WSL Codex amendment received fresh Reader semantic YES / builder-door YES
assignee: Builder — use `gpt-5.6-sol`; the root architect remains the only Astra seat
depends: WO-W1-03 accepted at candidate `665ddcd2783a9e218cb5095b51943d026d17f70a`

## Objective

Admit one real Codex Market Researcher through QuantFlow's existing Participant contract and prove that
the packaged Windows app can create its seat, assign it exact work, run that work in an isolated Codex
process, let it use an authorized Kernel-backed tool, show it on the Canvas, and close it cleanly while
Hermes retains the same meaning and behavior.

## In plain terms

Codex must become a real colleague inside QuantFlow: Ryan can add it from the Dock, see its seat on the
Canvas, give it a recorded assignment, watch the isolated real run, receive governed work, and close it
without a hidden process or a separate private version of the workspace.

## Context pack

Read only these current authorities before source work:

- [`START_HERE.md`](../../../START_HERE.md)
- [`CONTEXT.md`](../../../CONTEXT.md)
- [`PROTOCOL.md`](../PROTOCOL.md)
- [`OFFICIAL-ROADMAP.md` §6.7–6.8.1](../../plans/OFFICIAL-ROADMAP.md)
- [`INSTITUTION-CONTRACTS.md` §1 and §5](../../plans/INSTITUTION-CONTRACTS.md)
- [`DEMO-SPEC.md` Demo B](../../plans/DEMO-SPEC.md)
- [`qf-atlas/ATLAS.md`](../../../qf-atlas/ATLAS.md)
- Current Codex configuration reference: <https://developers.openai.com/codex/config-reference>

Do not use archived PB-0 inventories or Vault notes as a repair checklist. Inspect the current source and
change only the assumptions encountered by this first Codex consumer.

## Deliverable 0 — prove the runtime boundary before shared product edits

Use the founder-specified Codex CLI inside the default Ubuntu WSL2 distribution. Read-only order evidence
resolved `codex` to version `codex-cli 0.142.5`; production must resolve the declared WSL command without
hard-coding an operator home directory. Its supported isolation route is the one-task `codex exec` command.
Interactive `codex` does not accept the required ignore-user-configuration controls and is prohibited for
this order. The Builder must measure the WSL distribution, executable, and controls again. This probe is a
hard door: if any item below cannot be proved, stop without editing shared product code and report the exact
failure.

1. Through `wsl.exe`, resolve the same declared WSL `codex` command the packaged Windows host will launch.
   Use the operator's existing WSL authentication opaquely. Do not read, copy, log, hash, or record auth
   files, account ids, tokens, secrets, user configuration, or credential-bearing environment values.
2. Start a real one-task WSL Codex process with
   `codex exec --ephemeral --ignore-user-config --ignore-rules` in an empty app-owned WSL temporary working
   directory. Disable approval prompts, shell access, web search, apps, plugins, skill install/search,
   computer/browser use, image generation, multi-agent delegation, hooks, workspace-dependency tools,
   persistent history, and memory use/generation. Use a read-only sandbox. QuantFlow must inject only its
   required ontology and collaboration stdio MCP servers.
3. Declare the two QuantFlow MCP servers required and wait for the real child plus both servers before
   reporting readiness. The process must list its governed QuantFlow tools, receive one bounded probe Task
   as its initial input, and make one allowed read through a controlled QuantFlow RPC boundary.
4. Prove that shell, web, apps, and foreign MCP tools are unavailable. A malformed or wrong seat capability
   must be denied. QuantFlow may pass the names of its session, role, RPC, and seat-capability variables to
   the child; secret or capability values must never appear in argv, diagnostics, logs, or evidence.
5. Exercise normal one-task completion and cancellation separately. Both must confirm the owned WSL child
   process tree exits without terminating unrelated WSL processes, and remove the app-owned temporary
   directory.

An authentication prompt, unsupported safety control, ambient tool, MCP startup failure, security-value
leak, or uncertain cleanup is a red result. D0 is runtime evidence; it does not by itself claim product
admission.

## Deliverable 1 — declare Codex at the species boundary

Add the smallest current declaration under `species/codex/` that the measured D0 path requires:

- one Codex Market Researcher profile using the existing `worker` role with the existing `market.read`
  capability group;
- package and launch metadata accepted by the existing runtime definition contract;
- the bounded role instruction and declared tool surface needed for this seat;
- a species-owned WSL launcher only if D0 proves translation from the generic QuantFlow bridge environment
  to Codex CLI arguments is required. Production metadata selects the WSL adapter and command; it must not
  hard-code the measured operator home path.

The launcher may translate WSL transport details and emit the existing readiness marker. It must not decide
institutional roles, grants, Task meaning, review authority, or Kernel state. Do not add a Codex branch to
the Canvas, Dock semantics, Mission semantics, Kernel, or role policy.

## Deliverable 2 — make admission declaration-led

Repair only the current shared seams that block this declared participant:

- `collab-electron/src/main/dock-profiles.ts`: discover and validate the declared Hermes and Codex
  production manifests. Preserve exactly one default Research Director through role/capability rules.
- `collab-electron/src/main/agent-host.ts` and `collab-electron/src/main/ipc-kernel.ts`: report availability
  and launch readiness per declared adapter instead of treating global Hermes health as every runtime's
  precondition. Support the measured Codex task-first lifecycle: create the governed seat, bind the exact
  Task, then launch one isolated WSL process with that Task as its initial input.
- Keep definition resolution, Kernel admission, role/capability selection, live-seat authentication,
  ontology/collaboration gateways, peer delivery, Dock rendering, participant projection, and Task
  composition unchanged unless D0 or an acceptance falsifier proves a specific blocker.
- Do not use `host_acp` for Codex. It remains a Hermes implementation in this order.

Species ids may appear in their declaration/adapter/resources, the adapter registry, and provenance. They
may not become institutional control flow. Add an F1 bait that makes a new `if species === codex` or exact
Codex profile decision in shared admission, Dock, Canvas, Mission, grant, or Kernel code fail.

## Deliverable 3 — package the declared participant

Update the existing runtime staging and package inspection owners so an installed Windows package contains
the complete declared Hermes and Codex resources and fails closed when either declaration is incomplete.
This includes only the necessary portions of:

- `collab-electron/scripts/package-lib/runtime-staging.ts`
- `collab-electron/scripts/package-lib/package-inspect.ts`
- `collab-electron/package.json`
- their existing focused inventory, readiness, installer, and package-closure gates

There is no development-root fallback. Removing the Codex package or manifest must turn package inspection
red; the existing Hermes-missing control must remain red.

## Deliverable 4 — prove the four-pillar connection in the real app

Add one bounded integrated gate named `windows-dock-species`. It must run the packaged Windows application
with the real Codex CLI inside the founder's default WSL distribution; a fixture, scripted responder,
pre-seeded result, or substituted model cannot satisfy it.

1. The Dock shows the retained Hermes definitions and one available Codex Market Researcher as a normal
   Participant. The role is primary; runtime identity is shown second.
2. Adding Codex creates exactly one precreated governed Kernel `agent_session`, the exact `spawned_from`
   relation, and the ordinary participant tile on the same Canvas. The UI must describe it as ready for an
   assignment; it may not claim a runtime process is working before one exists.
3. Launch the retained Hermes Research Director. From the existing Canvas Task composer, create one exact
   Task assigned to the Codex session. The existing assignment/Redirect path must bind that exact Task and
   start one isolated WSL `codex exec` process with the Task envelope as its initial input. This order does not
   build a second delegation UI or a persistent interactive Codex terminal.
4. Real Codex receives the exact Task envelope and invokes one non-hard-coded allowed `market.read` tool,
   such as `qf_event_query`, through the real ontology MCP. Its real tool result and Kernel-published
   trajectory Artifact are linked by `produces` to that exact Codex session.
5. Control: the allowed market read succeeds. Falsifiers: a `desk.orchestrate` or `research.evaluate` tool
   is absent or denied, and the wrong session, role, or seat capability is denied.
6. For identical worker roles and Kernel grants, Hermes and Codex receive set-equal QuantFlow `tools/list`
   surfaces. Adapter metadata cannot grant institutional authority. Because the current peer registry permits
   one live PTY per role, run the same-role comparison sequentially in this order.
7. Normal one-task completion and explicit stop each confirm process-tree exit, live-role unregister,
   seat-capability revocation, scratch cleanup, and Kernel session closure. Hermes still launches and
   closes through its accepted persistent route.

The Task identity is checked from Kernel/Canvas truth and delivered in the existing PTY task envelope. A
`market.read` worker is not granted `desk.orchestrate` access merely so it can query Task objects.

## Contract

- The Kernel remains the only durable truth and `execute()` remains the only write path.
- Do not add a schema entity, role, capability group, dependency, service, or persistent store.
- Private runtime context stays private. Shared Task, tool use, result, session, and lineage facts are Kernel truth.
- Runtime identity is provenance and transport selection; it does not determine institutional authority.
- Codex is one isolated WSL process per exact Task in this order. QuantFlow may retain Kernel truth after
  the process exits, but it may not retain Codex's private runtime transcript as a second shared memory.
- Hermes keeps the same Research Director, worker, Critic, tool grants, launch behavior, and cleanup meaning.
- QuantFlow remains research/advisor only and exposes no wager, trade, stake, bankroll, or execution action.
- Every delegated Reader, Builder, or Verifier uses `gpt-5.6-sol`; only the root architect uses Astra.
- Pause product edits while the independent Verifier checks the immutable candidate. Do not merge or push.

## Acceptance gates

### Builder-run

Run the Atlas pre-edit sequence before product edits:

```text
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
```

After implementation, run the affected focused checks once:

```text
bun test collab-electron/src/main/dock-profiles.test.ts collab-electron/src/main/runtime-adapter.test.ts collab-electron/src/main/agent-host-lifecycle.test.ts collab-electron/src/main/package-resource-paths.test.ts
bun qa/run.ts dock-profile-identity
bun qa/run.ts dock-production-inventory
bun qa/run.ts package-closure
bun qa/run.ts dev-dock-readiness
bun qa/run.ts typecheck
bun qa/run.ts windows-dock-species
bun qf-atlas/generate.mjs
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
bun qf-atlas/generate.mjs --diff 665ddcd2783a9e218cb5095b51943d026d17f70a
```

Record the D0 transcript after removing paths or values that would reveal security material. Record each
gate's unedited PASS/FAIL output. The integrated receipt names the immutable candidate, package hash, real
Codex version/model identity reported by the runtime, Task/session/Artifact relations, tool-list comparison,
negative controls, process cleanup, and one legible Canvas capture.

### Verifier-run

A fresh `gpt-5.6-sol` Verifier reads the immutable candidate and independently reruns:

```text
bun qa/run.ts dock-production-inventory
bun qa/run.ts package-closure
bun qa/run.ts typecheck
bun qa/run.ts windows-dock-species
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
bun qf-atlas/generate.mjs --diff 665ddcd2783a9e218cb5095b51943d026d17f70a
```

The Verifier checks both the successful admission and the meaningful red controls. It returns separate
semantic and verification verdicts. This is a focused packaged feature qualification; do not repeat the
full W1 live investigation or whole release suite unless a changed shared boundary makes that necessary.

## Out of scope

- Automatic Mission worker selection and the complete Demo B collaboration story.
- Hermes/Codex question-and-answer, result handoff, cross-runtime Critic/Evaluation, revision, second round,
  interactive analytical surface, founder replacement flow, and broader same-role concurrency.
- Cleanup of exact-Hermes Director labels or selection that this direct Task proof does not encounter.
- `host_acp`, Codex App Server integration, Claude or any later runtime, general model routing, or a runtime marketplace.
- New credential storage/UI, schema changes, new truth stores, Canvas redesign, and unrelated Hermes refactors.
- Any real-world bet, trade, wager placement, or execution.

These are not waived product requirements. The next Wave-2 order consumes this admitted Codex seat to build
the real Hermes/Codex exchange, exact handoff, criticism, revision, and interactive analysis on one Canvas.

## Report back

Open with one nontechnical sentence stating what Ryan can now do. Then provide:

1. D0 result and the security controls observed, without security values.
2. Changed product behavior and exact files.
3. Focused gate output, including the valid path and every red control.
4. Immutable candidate, tree, package hash, real runtime/model identity, and evidence links.
5. Atlas check/ratchet/diff result.
6. Any place the order was silent and the Builder exercised judgment.
7. Exact unfinished limit, if any; never describe a refusal or partial path as completed admission.
