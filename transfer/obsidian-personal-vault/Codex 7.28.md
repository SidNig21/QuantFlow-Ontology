You are a fresh architect/diagnoser for QuantFlow Ontology. You have no prior chat history that counts as truth.

HARD RULES

- The repo is shared memory. Chat, plans, and agent transcripts are testimony only.
- Do not trust conclusions from other agents unless you re-measure them.
- Read authority in this order, in full, before proposing anything:
    1. START_HERE.md
    2. docs/orders/NEXT.md
    3. the current order it names
    4. docs/orders/PROTOCOL.md  
        Then as needed: docs/DOCTRINE.md, docs/ROADMAP.md, docs/orders/SCOPES.md, AGENTS.md.
- Never place bets/trades. Never handle credentials. Do not merge to main unless I explicitly ask.
- Work in a git worktree, not the shared main checkout.

FULL ACCESS

- Repo root: /home/sidnig21/QuantFlow-Ontology
- Existing worktrees under: /home/sidnig21/qf-worktrees/
- Live platform Kernel (if present): ~/.quantflow/kernel.db
- You may inspect disk, git, CI, docs, code, and run gates/builds.
- Do not delete operator data, kill processes, or force-push without asking.

FACTUAL STATE (re-verify; do not assume)

- main HEAD was recently at 9de0249; NEXT on main historically pointed at WO-K3.
- Branch wo-ci1 exists at /home/sidnig21/qf-worktrees/wo-ci1 (HEAD was d23c8ee) — off-ladder repair: production Electron build / schema package-export resolution. Builder claims done; NOT independently verified or merged.
- Branch wo-k3 exists at /home/sidnig21/qf-worktrees/wo-k3 — identity rung 3; builder report exists; D5 may be dishonest; not merged.
- Audit testimony (re-measure before acting): docs/AUDIT-A1-FINDINGS.md, docs/GTM-AUDIT.md.

YOUR JOB

1. Form your own diagnosis of what is broken vs merely unfinished for a founder-only daily-driver v1 ending at WO-111.
2. Rank blockers by evidence, with commands/paths.
3. Propose the next 1–3 verified orders only (Cursor-sized). Do not invent a mega-roadmap fiction.
4. If you recommend verifying/merging wo-ci1 first, or rewriting WO-K3, say why with receipts.
5. Open with one plain-language sentence a non-programmer can read.

Do not implement yet unless I say so. Diagnose first.

Show more

Tuesday 9:39 PM

Worked for 11m 52s

im just trying to find out whats wrong with my project, how to fix it, then move to finish the doctrine and have my working app. you feel me?

QuantFlow’s foundation is mostly sound, but the shipped Electron app is broken at two concrete seams; fix those before resuming the doctrine ladder.

## Diagnosis

### 1. Production builds are broken on `main` — immediate blocker

I reproduced this from `wo-k3`, which still has `main`’s configuration:

```
bun install --frozen-lockfile
bun run build
→ ENOTDIR ... qf-kernel-schema/src/schema.ts/transition-meta
→ exit 1
```

`wo-ci1` removes the stale private aliases and uses the package exports. My independent run produced:

```
84 + 122 + 11 + 12 + 29 unit tests passed
177 main modules transformed
10031 renderer modules transformed
production build → exit 0
bun qa/run.ts --all → exit 0
```

The repair is narrowly scoped and technically correct: [WO-CI1 (line 1)](/home/sidnig21/qf-worktrees/wo-ci1/docs/orders/WO-CI1.md:1).

**Verdict:** formally verify cold and merge `wo-ci1` first. Until then, `wo-k3` cannot satisfy its no-regression/build requirement and CI cannot reach the safety board.

### 2. The real app cannot record a newly spawned agent — immediate app blocker

The Electron adapter starts every transaction with bare `BEGIN IMMEDIATE`: [kernel.ts (line 20)](/home/sidnig21/qf-worktrees/wo-ci1/collab-electron/src/main/kernel.ts:20).

Creating an agent session nests two transactions:

- Outer transaction: [create.ts (line 249)](/home/sidnig21/qf-worktrees/wo-ci1/packages/qf-kernel/src/create.ts:249)
- Inner transaction: [insert.ts (line 66)](/home/sidnig21/qf-worktrees/wo-ci1/packages/qf-kernel/src/insert.ts:66)

I re-measured the runtime difference:

```
node:sqlite → cannot start a transaction within a transaction
bun:sqlite  → nested transaction accepted
```

All existing Kernel gates use Bun; Electron ships Node’s SQLite wrapper. Thus a seat may spawn as a process while its Kernel record fails.

**Verdict:** genuinely broken, not unfinished doctrine work.

### 3. `wo-k3` is substantially good, but D5 is not honest enough to merge

Independent results on `wo-k3`:

```
packages/qf-kernel → 60 pass
kernel-drift → PASS
kernel-sole-writer → PASS
kernel-one-path → PASS
publish-artifact-root six-shape confinement → PASS
vault-projection readonly drift path → PASS
```

The drift detector, incomplete-database refusal, readonly warning, and relocated confinement all held.

But D5 pre-writes the artifact file itself at [artifact-root/run.ts (line 57)](/home/sidnig21/qf-worktrees/wo-k3/qa/gates/artifact-root/run.ts:57), then passes that already-correct path into `execute()`. It never invokes the production publisher in `agent-host`. Therefore it cannot catch the production writer reverting to another directory.

The report nevertheless calls this “D5 publish proof”: [BUILD-REPORT.md (line 73)](/home/sidnig21/qf-worktrees/wo-k3/docs/orders/evidence/wo-k3/BUILD-REPORT.md:73).

**Verdict:** do not discard or fully rewrite K3. Give it one narrow REWORK round: integrate CI1, replace D5 with a production-path test, then run the production build and cold board.

### 4. The machine still has five Kernel files — residue, not current research loss

Re-measured:

```
~/.quantflow/kernel.db                         26 tables, 0 events
~/.qf-peer-bus/kernel.db                       26 tables, 0 events
~/.collaborator/.../kernel.db                  26 tables, 0 events
.wo008-home/.../kernel.db                      22 tables, 5 events
.wo008-home/.../kernel.db.pre-clean            22 tables, 12 events
```

No old Electron/sidecar holder was running during my check. The history is demo data, not founder research. Do not delete it automatically; inventory/archive it deliberately after K3.

### 5. Serious but not the first functional blocker

The local PTY and canvas sockets still accept requests without authenticating the caller. `session.create` accepts a command and arguments directly at [server.ts (line 239)](/home/sidnig21/qf-worktrees/wo-ci1/collab-electron/src/main/sidecar/server.ts:239). This needs fixing before treating arbitrary agents or plugins as untrusted, but it does not explain why today’s app cannot build or record a seat.

Product naming, updater destination, lifecycle cleanup, backup/migration and packaging are also real work, but they should not interrupt the three repairs below.

## The next three verified orders

1. **WO-CI1 — cold verify and merge.**  
    Use a detached clean worktree, frozen install, unit tests, production build, then `bun qa/run.ts --all`. My warm independent run is green; the protocol-required cold run remains.
    
2. **WO-K3 REWORK — honest production artifact proof.**  
    Integrate CI1, resolve the expected `qa/run.ts` overlap, and replace D5 with a test that invokes the real production publishing helper/path. It must assert both the resulting file and Kernel row without pre-planting the desired answer. Then build and run the full cold board.
    
3. **New small order: Electron Kernel runtime parity.**  
    Make `wrapDatabaseSync` savepoint-aware, add a Node-runtime test that executes `create_agent_session`, and make app database creation explicit: default first boot may create; a missing `QF_KERNEL_DB` override fails closed. Its acceptance must include the production build because Bun-only tests cannot prove this seam.
    

After those three verify, resume the doctrine route: **WO-N1 → WO-107b → WO-107 → WO-109 → WO-110 → WO-111**. WO-108 is explicitly demoted and should not be built. The remaining doctrine work is real-data ingest and the agent-run research loop—not another architecture rewrite.

Tuesday 9:51 PM

## okay great findings, i dont want to get sidetracked with this, but this repo i want you to look at, just the concept essentially and maybe some architecture if it intruges you to look at. [block/buzz](https://github.com/block/buzz) i think this captures the idea and concept of CLI agents collaborating, its just on a different visual layer compared to ours, our ontology is also much more robust i believe, i juts want you to get a little inspo from that and lets jump right into QuantFlow Ontology, ask me the goal i want to get if unsure and what it even is if you dont know.

i know the doctrine has a lot of big rungs left, mainly i want to enusre that broken code issue dosent happen again and is resolved.

Tuesday 9:55 PM

Worked for 57s

Buzz is strong confirmation of QuantFlow’s core idea: agents and humans share one governed world, but Buzz renders that world as rooms while QuantFlow renders it as active processes on a spatial canvas.

The useful parallels:

- Buzz’s relay is its single truth surface; QuantFlow’s Kernel is ours.
- Buzz treats agents as members with identities and audit trails, not background bots. That is excellent inspiration for WO-109’s real collaboration loop. [Buzz README](https://github.com/block/buzz)
- Buzz cleanly separates ACP agents from MCP tools. QuantFlow already follows the same seam and adds the stronger typed ontology/action layer. [Buzz agent architecture](https://github.com/block/buzz/blob/main/VISION_AGENT.md)
- Buzz’s “branch as room” maps nicely to QuantFlow’s future shape: a research task becomes a live arrangement of agent tiles, while the Kernel records the actual work.
- We should not import its Nostr relay, Postgres, Redis, or storage architecture. Those solve multi-user network deployment; adopting them would undermine QuantFlow’s local Kernel model.

The most useful idea to steal immediately is Buzz’s single `just ci` command: one command runs everything that shipping depends on, including desktop builds. [Buzz testing](https://github.com/block/buzz/blob/main/TESTING.md)

That exposed the exact remaining QuantFlow reliability hole:

- GitHub CI runs unit tests → production build → QA.
- [VERIFYING.md (line 37)](/home/sidnig21/qf-worktrees/wo-ci1/docs/orders/VERIFYING.md:37) tells independent verifiers to run only `bun qa/run.ts --all`.
- `qa --all` does not build Electron.
- Therefore a verifier can declare PASS while the production build is broken and GitHub is red—which is precisely what happened.

So I would slightly amend the immediate sequence:

1. **Finish WO-CI1 with one authoritative verification command.**  
    Add something like `bun qa/ci.ts` that performs frozen Electron install → unit tests → production build → QA board. Both GitHub Actions and `VERIFYING.md` must invoke that same command. Keep the new alias gate as the specific regression lock.
    
2. **Cold-run that command and merge CI1.**  
    The alias fix itself is already independently green; this small addition prevents the wider “QA green, shipped runtime broken” class.
    
3. **Then K3’s narrow D5 rework and Electron/Node SQLite parity.**  
    The latter gives the real shipped database adapter its own regression test, addressing the second runtime mismatch we found.
    

That is not a doctrine detour. It is the lock on the workshop door before we continue building `WO-107b → 107 → 109 → 110 → 111`.

I know the target now: **a founder-only QuantFlow daily driver where you can open the canvas, give agent seats a sports-research goal, watch them collaborate through typed Kernel actions, ingest real Bovada data, receive a mechanically reviewed report, and trust that the app actually works in its shipped form.**

Tuesday 9:56 PM

"I know the target now: **a founder-only QuantFlow daily driver where you can open the canvas, give agent seats a sports-research goal, watch them collaborate through typed Kernel actions, ingest real Bovada data, receive a mechanically reviewed report, and trust that the app actually works in its shipped form."**  
hell yeah, this basically sums it up more or less, there are some finer details involved but yes, the most important aspect is the collaborative agents seats on the Dock Catalog. i need any CLI tool or agent to collaboratate on the canvas. i have other goals that range in complexity like browers ttiles and RL of models to help analysis.  
please try to see if there is a log or history of my past mistakes and confuionsions like SDKs and other runtimes, trying to stack all in one. this is a big problem an di need to figure out the best way to build this. its been months of debuggin and this doctrin build stated last week looks really promising, like a revamp of QuantFlow into QuantFlow Ontology. help me out man please.

Tuesday 10:01 PM

Worked for 2m 22s

You’re not crazy and you do not need another rewrite—the project’s main idea stayed sound, but too many runtimes and frameworks were repeatedly allowed to become the foundation.

## What actually went wrong

The history shows one recurring mistake: QuantFlow tried to make a single technology own agent execution, orchestration, memory, tools, collaboration, and the interface.

|Failure pattern|Repository receipt|Consequence|
|---|---|---|
|Electron services became truth stores|`git show 8a6f6ac` added `runtime-state.json` and toolbox JSON persistence|State fragmented outside the Kernel|
|Everything was wired together at once|`git show 0f5fdc7` spread orchestration through RPC, shell, canvas, channels, and UI|A runtime change broke the whole application|
|SDK claims were accepted before measuring behavior|[WO-004.md](/home/sidnig21/qf-worktrees/wo-ci1/docs/orders/WO-004.md) documents the reversed AgentOS session-ID assumption and nonexistent ToolLoop identity|The architecture was built around capabilities the stack did not actually have|
|Tests proved their own setup|[WO-004a.md](/home/sidnig21/qf-worktrees/wo-ci1/docs/orders/WO-004a.md) and [WO-008e.md](/home/sidnig21/qf-worktrees/wo-ci1/docs/orders/WO-008e.md) record tautological identity and self-logged collaboration proofs|Green tests did not prove the real seam|
|Native CLIs were forced into invented UI|History includes replacing terminals with ACP chat, followed by the native-TUI correction|CLI character and compatibility were lost|
|The substrate preceded the useful product|`git show a826be0` parked v0.1 because the domain plane contained no real facts|A functioning engine existed without a working research desk|
|Development success was mistaken for shipped success|Bun tests passed while the production Electron build and Node SQLite behavior diverged|Broken code reached “verified” status|

The repository is candid about these mistakes. The best records are [RESEARCH.md](/home/sidnig21/qf-worktrees/wo-ci1/docs/RESEARCH.md), [BLUEPRINT.md](/home/sidnig21/qf-worktrees/wo-ci1/docs/BLUEPRINT.md), and the debt register in [ROADMAP.md](/home/sidnig21/qf-worktrees/wo-ci1/docs/ROADMAP.md).

## What QuantFlow should be

QuantFlow is not an agent framework. It is a governed local research desk that can host many agent frameworks and CLI species.

````
```mermaid
flowchart LR
    D["Dock Catalog"] --> H["Generic seat host"]
    C["CLI species"] -->|"Native PTY always"| H
    C -->|"ACP when supported"| H

    H --> R["Collaboration router"]
    R --> H2["Other agent seat"]
    R -->|"Messages and receipts"| E["Kernel execute()"]

    H -->|"Granted MCP tools"| E
    B["Browser or data tool"] -->|"Facts and artifacts"| E
    E --> K["Kernel: sole product truth"]
    K --> V["Canvas projections"]

    H -. "Ephemeral terminal stream" .-> V
```
````

That establishes the ownership rules:

- **Dock Catalog:** describes what can be launched. Adding a compliant CLI should require a species definition or adapter—not changes to the canvas, Kernel schema, or Electron UI.
- **Seat host:** owns process groups, cancellation, input/output, and lifecycle. Native PTY is the universal baseline; ACP is an optional richer protocol.
- **MCP:** supplies governed tools to agents. It is not memory and does not own sessions.
- **Kernel:** owns goals, messages, facts, artifacts, evaluations, identities, permissions, and collaboration receipts.
- **Canvas:** displays Kernel truth and ephemeral process output. It never proves collaboration merely because something animated.
- **AgentOS, Rivet, VMs, and model SDKs:** optional execution environments or adapters—not the floor underneath every seat.

“Any CLI agent” can realistically mean:

1. Any CLI can be launched, shown, stopped, and recorded through a PTY.
2. ACP-capable CLIs get structured prompts, cancellation, and session control.
3. MCP-aware agents get typed QuantFlow tools.
4. Untrusted CLIs can use a quarantined execution environment.
5. A CLI with no controllable input can be observed or used as a tool, but cannot magically become a conversational collaborator.

Buzz supports this direction: protocols at the boundaries, process isolation, and collaboration independent of the visual surface. QuantFlow does not need Buzz’s infrastructure stack.

## Broken now versus unfinished

Currently broken or untrustworthy:

1. **Shipped-build integrity.** Main has not absorbed the `wo-ci1` production-build repair, and the documented verifier path does not execute the same complete sequence as CI.
2. **Electron/Node SQLite semantics.** Nested Kernel execution can break `create_agent_session`; passing under Bun does not prove the shipped runtime.
3. **WO-K3 evidence.** Its D5 gate reportedly pre-creates the file the action is supposed to create. That does not prove the action.
4. **Verification architecture.** There is no single authoritative cold command used identically by builders, verifiers, and GitHub Actions.

Merely unfinished:

- Bovada ingestion and domain ontology
- Goal dispatch from the canvas
- Mechanical critic/evaluator workflow
- Complete Dock Catalog admission
- Browser resource tiles
- RL and model-improvement loops
- The final WO-111 daily-driver vertical slice

Those unfinished features should not trigger another substrate rewrite.

## The next three orders

1. **Close `wo-ci1` honestly.** Add one authoritative verification entry point covering cold install, unit tests, production Electron build, and every QA gate. Run it from a clean worktree and falsify the build-resolution gate before considering a merge.
    
2. **Narrowly rework and independently verify WO-K3.** D5 must begin without the target file, invoke the real typed action through `execute()`, and then prove the file exists and has correct ownership. Its bait must corrupt the action path and turn the gate red.
    
3. **Repair shipped-runtime parity.** Test Kernel transactions and `create_agent_session` through the exact Electron/Node adapter used by the packaged application, including nested execution and rollback. This is a small runtime order, not another architecture project.
    

After those three, resume the doctrine ladder toward the Dock Catalog and the WO-111 vertical slice.

For RL, start later with evaluation-driven playbook improvement because it survives swapping Claude, Codex, Hermes, or another model. Weight training should remain a workload inside QuantFlow—not a new foundation underneath it.

The doctrine is promising because it finally gives every layer one owner. The job now is to defend that boundary, complete one real sports-research path end to end, and stop changing the floor. No code or branches were changed during this diagnosis.

Tuesday 10:03 PM

## do you understand Hermes Agent as blank profile setups for specific Dock Catalog Agents, essentially my own version of EVE framework by vercel.

if you get that, i want you to take over as the lead architect and help me get quantflow back on track as well as built out and shippable to me as the founder only.

Tuesday 10:09 PM

Worked for 2m 1s

Yes—I understand it now, and my earlier framing of Hermes as merely one CLI species was incomplete.

Hermes is your reusable agent-building substrate. A Hermes profile supplies the identity, instructions, skills, model configuration, tool grants, and behavioral contract. Each configured profile becomes a distinct agent in the Dock Catalog.

That closely matches EVE’s “an agent is a directory” model: instructions, skills, tools, channels, and runtime configuration compose an agent. QuantFlow’s difference is that those agents operate locally on a shared spatial canvas, while the Kernel governs their work and collaboration. We borrow that authoring idea without adopting Vercel’s cloud foundation. [Vercel EVE](https://vercel.com/eve), [EVE repository](https://github.com/vercel/eve).

The correct QuantFlow model is:

|Concept|Example|Responsibility|
|---|---|---|
|Runtime/harness|Hermes, Codex CLI, Claude Code|Executes the agent|
|Agent definition/profile|Quant Researcher, Critic, Orchestrator|Identity, instructions, skills, tools, permissions|
|Agent session/seat|One running Researcher tile|Live lifecycle and collaboration|
|Dock Catalog|Available authored agents|Browse, spawn, inspect|
|Kernel|Tasks, messages, artifacts, evaluations|Shared governed truth|

The current code does not fully express this. It hard-codes `qf-orchestrator`, `qf-worker`, and `qf-worker-2` in [hermes-seats.ts](/home/sidnig21/qf-worktrees/wo-ci1/collab-electron/src/main/hermes-seats.ts), while [register.ts](/home/sidnig21/qf-worktrees/wo-ci1/species/hermes/register.ts) registers only one generic `hermes` definition. The ontology then records the species name in a session label instead of structurally binding the session to the exact profile that launched it. That is a real architectural gap.

The binding invariant will be:

> A Dock entry is a versioned agent profile. Spawning it creates a session bound to that exact definition. Creating another Hermes agent requires profile data and governed artifacts—not Electron, canvas, or host source changes.

Different Hermes profiles may share the same `package_ref`, while carrying different prompt/skill bundles, roles, permissions, model policies, and tool grants. External CLI agents use different runtime adapters but enter through the same definition → session → seat contract.

I accept the lead-architect role. I will:

1. Reconcile the Hermes/profile distinction in a narrow founder-direction amendment and draft its falsifiable Dock contract.
2. Close the production-build verification hole before expanding features.
3. Rework WO-K3 honestly and prove Electron/Node Kernel behavior.
4. Resume the doctrine ladder toward WO-109, where live unscripted profile collaboration becomes mandatory.
5. Finish WO-110’s mechanical critic and WO-111’s one-shot founder proof.
6. Keep browser tiles and RL aligned as later tools/workloads, never replacement foundations.

I will work through orders in worktrees, preserve the one-Kernel rule, never place trades or handle credentials, never approve my own work, and never merge to `main` without you explicitly asking. The active objective is now the founder-only shippable QuantFlow daily driver—not another framework evaluation cycle.

Tuesday 10:11 PM

Worked for 13m 37s

you can use cursor cli to help nuild or verify your work. composer 2.5 only

take 2 subagents to reallyy read thru not only the whole repo and docs what not whats relevant, but also the vault, specifically where this inspo for the ontology came from, firect palantir./home/sidnig21/Vaults/Personal/Projects/QuantFlow/Research  
do a real thorough search, forrreal, all the answers are here, youre smart enough to not only find them but cultivate them correctly

The good news is that QuantFlow’s ontology foundation is genuinely strong; the main correction is the agent plane and the shipped-runtime discipline, not another rebuild.

I used two independent repo/vault readers, then re-measured the important claims myself. The evidence converges cleanly.

## What the Palantir research actually says

The direct sources—especially [Ontology MCP](/home/sidnig21/Vaults/Personal/Projects/QuantFlow/Research/DevCon6/08 - Ontology MCP.md), [Ontology Governance](/home/sidnig21/Vaults/Personal/Projects/QuantFlow/Research/DevCon6/09 - Ontology Governance.md), [Agent Engine](/home/sidnig21/Vaults/Personal/Projects/QuantFlow/Research/DevCon6/03 - Agent Engine.md), and [Frank Coyle’s ontology talk](/home/sidnig21/Vaults/Personal/Projects/QuantFlow/Research/Why Agentic Systems Need Ontologies (Frank Coyle, AIE 2026\).md) support these rules:

- Model the real research domain first; map vendors and runtimes onto it afterward.
- One connected object/link/action world beats numerous disconnected MCP servers.
- Generate agent tools from that world.
- Agent definitions are configured identities over reusable runtimes.
- Agents propose; typed actions and ontology constraints permit or reject.
- Attribution, lifecycle, and proof-of-work must be structural.
- Write useful outcomes back into the world so later agents inherit them.
- Names and descriptions are operating context for agents.

QuantFlow explicitly rejected Foundry as a dependency, Palantir cloud machinery, OWL/triplestores, enterprise-scale ACL machinery, and source-shaped schemas. [The original verdict](/home/sidnig21/Vaults/Personal/Projects/QuantFlow/Research/DevCon6/00 - The Integration Question.md) remains correct: borrow the doctrine, not the platform.

The research does not support making AgentOS, Hermes, Vercel AI SDK, or any other runtime the product’s universal foundation.

## What is already real

I dynamically measured the current schema:

```
{
  "objects": 23,
  "links": 15,
  "actions": 25,
  "generatedTools": 94,
  "pipelineFed": ["instrument", "quote"],
  "operatorOnly": ["observe_ticket"]
}
```

The following are genuine strengths:

- Strict descriptions and lifecycle rules
- One canonical `run` rather than separate BacktestRun/ScreenRun types
- Generated MCP tools
- Zod input validation
- Endpoint-validated links
- One `execute()` write path
- Pipeline-fed market objects
- Mechanical transition tests
- Report-gating vocabulary already present

This is a real ontology implementation, not marketing language.

## The central drift: Hermes and the Dock

The intended model is:

```
Hermes runtime
    ├── QuantFlow Orchestrator profile
    ├── Market Researcher profile
    ├── Backtester profile
    └── Adversarial Critic profile

Each profile → Dock agent definition → spawned live session
```

The live implementation instead does this:

```
one Kernel definition: "hermes"
    └── hard-coded host seats:
        orchestrator / worker / worker2
```

Receipts:

- [agent.ts](/home/sidnig21/qf-worktrees/wo-ci1/qf-kernel-schema/src/ontology/agent.ts) still defines an agent definition as a “species.”
- [register.ts](/home/sidnig21/qf-worktrees/wo-ci1/species/hermes/register.ts) registers only `hermes`.
- [hermes-seats.ts](/home/sidnig21/qf-worktrees/wo-ci1/collab-electron/src/main/hermes-seats.ts) hard-codes the three actual profiles.
- A session has no structural link to the definition/profile that spawned it.
- The species currently rides in the session’s human-readable label.

That contradicts the doctrine’s own `AgentDefinition → SPAWNS → AgentSession` graph.

The corrected contract is now:

> Hermes is a reusable runtime/profile substrate. A Dock entry is an immutable, founder-authored agent definition. A seat is one live session spawned from an exact definition revision.

Multiple profiles may share the same Hermes package. Adding another Hermes agent must require profile data and governed artifacts—not changes to Electron, the Dock, or canvas source.

## Further agent-plane gaps

The deep audit also surfaced four related problems:

1. **No per-profile Kernel authority.** Hermes has a host-side tool allowlist, but every connected client currently receives essentially the same generated QuantFlow action surface. Kernel trace context does not identify the calling session or definition.
    
2. **Collaboration is not fully typed yet.** The peer bus durably stores role-addressed messages and publishes trajectory artifacts, but it does not create the declared task, assignment, and delegation graph. Sender/recipient identity remains partly inside transport rows and strings.
    
3. **No profile-to-session or session-to-run provenance.** The Kernel cannot traverse “which exact Critic profile produced this evaluation?”
    
4. **Two collaboration implementations remain.** The older A2A mechanism and `qf-peer-bus` need convergence during WO-109, not parallel blessing.
    

These are unfinished product contracts, not reasons to replace the Kernel.

## Current broken blockers

### 1. WO-CI1 works, but still needs rework

I independently verified `wo-ci1` from a clean disposable clone:

- Frozen install: passed
- Electron unit tests: 258 passed
- Production main build: 177 modules
- Production renderer build: 10,031 modules
- Full `bun qa/run.ts --all`: passed
- All three gate baits: red
- Restored gate: green

The code repair works.

However, [VERIFYING.md](/home/sidnig21/qf-worktrees/wo-ci1/docs/orders/VERIFYING.md) still tells verifiers to run only `bun qa/run.ts --all`, while GitHub Actions runs install → units → build → QA. Therefore a local verifier can still certify code without building the shipped app.

My ruling is **WO-CI1 REWORK**, not PASS, until one authoritative release-verification command is invoked by both CI and verifiers and a gate fails if the build step disappears.

### 2. Packaged Electron session creation is broken

I directly reproduced the runtime divergence:

```
NODE_NESTED_ERROR=cannot start a transaction within a transaction
BUN_NESTED_OK
```

The Electron Node adapter uses bare `BEGIN IMMEDIATE`. `create_agent_session` opens a transaction and then calls an insert helper that opens another transaction.

Worse, the Hermes native-TUI path creates the PTY before calling `create_agent_session`. In the shipped app, the PTY can start, Kernel creation can fail, and the process can be left without a governed session row.

### 3. WO-K3 D5 does not prove its claim

Its gate creates the artifact file before invoking publication, then proves the already-created file exists. That does not prove the production byte-writing seam follows the canonical artifact root.

The rest of K3 should not be discarded. D5 needs a narrow rewrite around the real byte producer, plus a red bait.

### 4. Local control sockets are unauthenticated

I confirmed the sidecar writes a token but does not validate it on incoming calls—and even returns it from `ping`. The control surface accepts command, arguments, environment, terminal input, browser navigation, clicking, typing, and evaluation.

Founder-only does not make this harmless once agents process untrusted web/data content. Socket authentication must land before arbitrary or untrusted CLI admission.

## Before real Bovada ingestion

Two ontology issues must be resolved before loading durable market data:

- `ticket.legs` is currently an array of untyped records while `has_leg` separately links tickets to instruments. Per-leg price, selection, ordering, result, and void handling need one coherent structural home.
- Several doctrine relationships remain prose-only, including hypothesis → instrument and profile → session.

This is exactly the Palantir DDD rule: fix the model before mapping the vendor payload. Do not ingest Bovada and then redesign the graph around persisted rows.

## The next three orders

1. **WO-CI1 rework:** one authoritative cold release command shared by CI and verifiers; gate and bait the presence of unit, build, and QA stages.
    
2. **WO-K3 D5 rework:** test the real artifact-byte writer, canonical root, exact content/hash registration, and a falsified bad-root production seam.
    
3. **Electron Kernel parity:** make transactions re-entrant/savepoint-aware or establish one transaction owner; exercise `create_agent_session` through the packaged `node:sqlite` adapter and prove failed admission cleans up the PTY.
    

Immediately after those, before live ingest, comes the narrow Hermes profile-identity correction. Socket authentication must close before the “any CLI” promise is considered safe.

Browser tiles remain a capability granted to a seat. RL remains a consumer of recorded evaluations and trajectories. Neither should become a new foundation.

I also confirmed Cursor’s required model ID is `composer-2.5` and invoked it read-only. That run exited successfully but returned no written review, so I did not count it as evidence.

No repository files were changed, nothing was merged, and no operator data or credentials were inspected.

Tuesday 10:25 PM