# WO-W2-01 — Admit Codex as a real QuantFlow participant

status: BUILDING — founder directed implementation in the real app; standalone hidden D0 loop ended
assignee: root architect — founder ended the delegated probe loop and directed immediate real-app implementation; any later delegated Builder or Verifier uses `gpt-5.6-sol`
depends: WO-W1-03 accepted at candidate `665ddcd2783a9e218cb5095b51943d026d17f70a`

## Objective

Admit one real Codex Market Researcher through QuantFlow's existing Participant contract and prove that
the packaged Windows app can launch it as an interactive WSL terminal tile, connect QuantFlow's governed
MCP tools, assign exact work, receive governed work, and close it cleanly while Hermes retains the same
meaning and behavior.

## In plain terms

Codex must work like the existing Hermes seat: Ryan adds it from the Dock, a live Codex terminal opens on
the Canvas through WSL, QuantFlow's tools are connected, recorded assignments reach that exact seat, and
closing it leaves no hidden process or separate private version of the workspace.

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

## Measured runtime boundary and live-app proof rule

Use the founder-specified interactive Codex CLI inside the default Ubuntu WSL2 distribution. Read-only
order evidence resolved `codex` to version `codex-cli 0.142.5`; production must resolve the declared WSL
command without hard-coding an operator home directory. Earlier standalone probes established the WSL
route, attached-process requirement, Windows `node.exe` MCP bridge pattern, and one unsupported flag:
`skill_search` is not recognized by this CLI and must not be passed. The founder ended further hidden
probe cycles and directed the Builder to construct the actual tile, package the app, and test it visibly.
The requirements below are therefore proved through the real packaged application, not another standalone
harness.

1. Through `wsl.exe`, resolve the same declared WSL `codex` command the packaged Windows host will launch.
   Use the operator's existing WSL authentication opaquely. Do not read, copy, log, hash, or record auth
   files, account ids, tokens, secrets, user configuration, or credential-bearing environment values.
2. Start the real interactive `codex` command in a PTY through WSL, using the product launch shape. Preserve
   the operator's existing WSL login opaquely. Apply only controls supported by the measured CLI to disable
   approval prompts, shell access, web search, apps, plugins, skill installation and any available discovery,
   computer/browser use, image generation, multi-agent delegation, hooks, workspace-dependency tools,
   persistent history, and memory use/generation. Use a read-only sandbox. QuantFlow must inject only its
   required ontology and collaboration stdio MCP servers.
3. Declare the two QuantFlow MCP servers required and wait for the real child plus both servers before
   reporting readiness. Without reading the operator's Codex config, prove from the running seat that the
   command-line overrides replace or disable ambient MCP/plugin surfaces. The live seat must list its
   governed QuantFlow tools, accept one bounded instruction through its PTY, and make one allowed read
   through a controlled QuantFlow RPC boundary.
4. Prove that shell, web, apps, and foreign MCP tools are unavailable. A malformed or wrong seat capability
   must be denied. QuantFlow may pass the names of its session, role, RPC, and seat-capability variables to
   the child; secret or capability values must never appear in argv, diagnostics, logs, or evidence.
5. Keep the Windows `wsl.exe` parent attached until the exact interactive Codex process group exits. The measured
   correction is a waiting WSL session leader (`setsid --wait`) or an equivalently proved non-detaching
   launch; plain detaching `setsid` is prohibited because it returns false success before Codex readiness.
   Give each probe a non-secret run nonce, record its exact owned Windows/WSL descendants, and take a
   baseline before launch so pre-existing QuantFlow MCP children are never credited to or killed by this
   run. Exercise normal interactive exit and forced cancellation separately. Both must confirm only that
   run's owned WSL child process tree exits without terminating unrelated WSL processes, and remove any
   app-owned temporary directory.

An authentication prompt, ambient tool, MCP startup failure, security-value leak, or uncertain cleanup is
a red live-app result. An unavailable feature that is absent from the CLI is not enabled and must not be
passed as an unsupported flag. These checks remain product acceptance requirements; they no longer block
construction of the real tile that must demonstrate them.

## Deliverable 1 — declare Codex at the species boundary

Add the smallest current declaration under `species/codex/` that the measured D0 path requires:

- one Codex Market Researcher profile using the existing `worker` role with the existing `market.read`
  capability group and the normal interactive terminal surface;
- package and launch metadata accepted by the existing runtime definition contract;
- the bounded role instruction and declared tool surface needed for this seat;
- a species-owned WSL launcher, parallel in responsibility to the Hermes launcher, that translates the
  generic QuantFlow bridge environment to interactive Codex CLI arguments, supplies only the two QuantFlow
  MCP definitions, holds the Windows wrapper open until the exact WSL process group exits, and emits
  readiness only after Codex and both required MCP servers are alive. Production metadata selects the WSL
  adapter and command; it must not hard-code the measured operator home path or detach the process group.

The launcher may translate WSL transport details and emit the existing readiness marker. It must not decide
institutional roles, grants, Task meaning, review authority, or Kernel state. Do not add a Codex branch to
the Canvas, Dock semantics, Mission semantics, Kernel, or role policy.

## Deliverable 2 — make admission declaration-led

Repair only the current shared seams that block this declared participant:

- `collab-electron/src/main/dock-profiles.ts`: discover and validate the declared Hermes and Codex
  production manifests. Preserve exactly one default Research Director through role/capability rules.
- `collab-electron/src/main/agent-host.ts` and `collab-electron/src/main/ipc-kernel.ts`: report availability
  and launch readiness per declared adapter instead of treating global Hermes health as every runtime's
  precondition. Support the same product lifecycle as Hermes: launch the governed interactive seat from
  the Dock, then deliver exact assigned Tasks to that live PTY.
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
2. Adding Codex launches exactly one interactive WSL Codex process, creates exactly one running governed
   Kernel `agent_session`, records the exact `spawned_from` relation, and opens the ordinary terminal
   participant tile on the same Canvas.
3. Launch the retained Hermes Research Director. From the existing Canvas Task composer, create one exact
   Task assigned to the live Codex session and use the existing Redirect/steer path to deliver that Task
   envelope to the exact Codex PTY. This order does not build a second delegation UI.
4. Real Codex receives the exact Task envelope and invokes one non-hard-coded allowed `market.read` tool,
   such as `qf_event_query`, through the real ontology MCP. Its real tool result and Kernel-published
   trajectory Artifact are linked by `produces` to that exact Codex session.
5. Control: the allowed market read succeeds. Falsifiers: a `desk.orchestrate` or `research.evaluate` tool
   is absent or denied, and the wrong session, role, or seat capability is denied.
6. For identical worker roles and Kernel grants, Hermes and Codex receive set-equal QuantFlow `tools/list`
   surfaces. Adapter metadata cannot grant institutional authority. Because the current peer registry permits
   one live PTY per role, run the same-role comparison sequentially in this order.
7. Normal interactive exit and explicit stop each confirm process-tree exit, live-role unregister,
   seat-capability revocation, scratch cleanup, and Kernel session closure. Hermes still launches and
   closes through its accepted interactive route.

The Task identity is checked from Kernel/Canvas truth and delivered in the existing PTY task envelope. A
`market.read` worker is not granted `desk.orchestrate` access merely so it can query Task objects.

## Contract

- Anything that is a QuantFlow product capability belongs to the Participant contract, not to Hermes.
  Hermes is the first adapter and Codex is the first proof that the product contract is runtime-independent.
  An adapter owns only its runtime-specific launch, terminal, approval, and transport behavior. Once admitted,
  every runtime receives the same role, Task, permission, evidence, capability, Artifact, communication,
  criticism, revision, steering, replacement, lifecycle, Canvas, history, and retrieval semantics that its
  declared role and grants authorize. A genuine runtime limitation is shown honestly and never hidden by a
  species-specific product branch or fake parity.
- The Kernel remains the only durable truth and `execute()` remains the only write path.
- Do not add a schema entity, role, capability group, dependency, service, or persistent store.
- Private runtime context stays private. Shared Task, tool use, result, session, and lineage facts are Kernel truth.
- Runtime identity is provenance and transport selection; it does not determine institutional authority.
- Codex keeps its private interactive conversation inside its own WSL seat. QuantFlow retains only the
  shared Task, tool-use, result, lineage, Evaluation, and lifecycle facts that belong in Kernel truth.
- Dock opening follows class: Participants open their admitted working surface; Data, Tools, Methods, and
  Compute open, attach, or invoke a job-appropriate Canvas surface and never pose as terminal participants.
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
- `host_acp`, one-task `codex exec`, Codex App Server integration, Claude or any later runtime, general
  model routing, or a runtime marketplace.
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
