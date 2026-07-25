# SCOPES.md — the build ladder, rung by rung

> **What this file is.** One scope contract per rung: objective, dependencies, what is in, what
> is out, and the gate that can go red. It is the map. It is **not** the orders themselves.
>
> **What a scope contract is not.** A full order names exact files, exact predicates, exact
> commands. That can only be written once the rung beneath it has landed, because half of what
> an order must say is *"here is what the last one actually produced."* Orders written far ahead
> are orders written from inference, and this repo has already paid for that once.
>
> **Rule: an order is written at most one rung ahead of the build front.** WO-101 and WO-102
> are written. Everything below is a contract, promoted to an order when its predecessor reports.

Authority: `docs/DOCTRINE.md` is *why*, `docs/ROADMAP.md` is the debt register and phase gates,
this file is the sequence, `docs/orders/` is the work. `START_HERE.md` beats all four.

---

## Why this ladder is eleven rungs, not ten

The ten-order ladder was drawn on 2026-07-24 against a schema that was measured and a Kernel
that was **assumed**. Measurement on 2026-07-25 found the assumption false:

| Declared | Actually reachable |
|---|---|
| 19 object types | **3** can be created (`artifact`, `agent_session`, `agent_definition`) |
| 27 actions | **18** wired; **9** throw `Unknown command` at `execute()` |
| 13 link types | **0** writable — `links` table generated, zero reads, zero writes, repo-wide |

The defining workflow is `Hypothesis → Dataset → Run → Artifact → Evaluation → Report`. Exactly
one of those six stages can be brought into existence. `start_run` and `resolve_hypothesis` are
transitions over rows no code path can create. `create_hypothesis`, `register_dataset_version`
and `record_evaluation` are defined actions that throw.

The ontology has **nodes and no edges, and most of the nodes are unreachable.** Every rung above
rung 3 assumed otherwise: read tools would read empty tables, a pipeline would have nowhere to
land, a loop could not record itself, and the closing proof — *"which evaluation gated it"* — is
a graph traversal over edges that cannot exist.

So a rung was inserted at position 3: **the write path**. Nothing was dropped; the ladder got
one rung longer and honest.

---

## P1 · The charter — schema only

Two orders, both pure `qf-kernel-schema` work, zero Kernel changes. They can be reviewed in one
context and they are the cheapest rungs on the ladder. Do them first because every later rung
inherits their vocabulary.

### WO-101 · Research + agent plane charter · **written, cuttable**

**Objective.** The research and agent planes become a charter an agent can act on: split by
plane, descriptions rewritten as agent context, RL vocabulary reserved, anti-pattern lints as
code.

**In.** Plane split into `src/ontology/{research,market,agent}.ts` · descriptions (research +
agent only) · `policy` / `environment` / `run.kind: "training"` names-only · `mission` decision ·
Silo + active-freeze lints.

**Out.** Any Kernel change · any new action or command · link writes · market-plane descriptions
· the report gate.

**Gate.** Three lint sabotages go red and restore green · a cold agent given only the three plane
files names the right types, links, and `evaluation.verdict === "supports"` · suite green cold
and grown.

Full order: [`WO-101.md`](WO-101.md).

### WO-102 · Market plane reframe

**Objective.** Betting stops being types and becomes rows. The market plane becomes
market-agnostic so a game line and a perpetual future are the same four types.

**Depends on.** WO-101 (the plane files must exist to rewrite).

**In.** `competitor` · `event` · `market` · `odds_series` · `result` → `venue` · `instrument` ·
`quote` · `market_event`. Market-plane descriptions rewritten to the WO-101 register.
`pipelineFed` marking: quotes and market events get **no** action — the Golden Hammer rule.

**Out.** Ingesting anything real (WO-107) · any Kernel change · new planes.

**Gate.** No sport-specific noun survives as a type name · golden regenerated and committed ·
suite green.

**The trap this order must not walk into.** `event` is a **stateful type** —
`transitions.ts` carries an `event` table (`scheduled → live → settled | void`) and `commands.ts`
carries `start_event` / `settle_event` / `void_event`. Renaming `event` → `market_event` is
therefore **not** a schema-only rename: it moves a transition table, three commands, and every
generated conformance test that names them. The order must say so explicitly, and the builder
must regenerate conformance and state the count delta. Estimate this rung as larger than it
reads.

**Open question for the order author.** `ticket` and `strategy` currently sit in the Research
plane. Under advisor-only, a `ticket` is *the operator's own recorded stake*, not an instruction
to a venue. Decide whether it stays in Research (a record of what was acted on) or moves to
Market (a market-side object). Do not leave this to the builder.

---

## P2 · The Kernel can record the workflow

This is the phase the old ladder was missing. Until it lands, everything above it is scaffolding
around an empty room.

### WO-103 · The write path — creation and edges · **the missing foundation**

**Objective.** Every stage of the defining workflow can be created, and the graph can have
edges. After this rung the six-stage workflow is *recordable*; before it, it is decoration.

**Depends on.** WO-101, WO-102 (write against final vocabulary — doing this first would mean
doing it twice).

**In.**
- Creation commands for the workflow's missing stages: `hypothesis`, `dataset`, `run`,
  `evaluation`, plus `mission` if WO-101 added it. Each needs a `creationCommands` entry, a
  domain event, and a lint join.
- **Link writes.** `execute()` gains the ability to persist edges into the existing `links`
  table (`golden/migration.sql:369`, already CHECK-constrained over all 13 link names).
- **Adjudicate the nine dead actions**, one by one, wire-or-delete: `create_hypothesis`,
  `register_dataset_version`, `record_evaluation`, `retry_run`, `close_run`, `request_approval`,
  `approve`, `deny`, `promote_type`. Note that `retry_run` and `close_run` have **no legal edge
  in the transition table at all** — `run`'s terminal states are all `[]`. Either the table gains
  edges or the actions go. A defined action that can never execute is a lie in the tool surface.
- One end-to-end fixture: the six-stage chain created and linked through `execute()` only.

**Out.** MCP tools of any kind (WO-104) · real market data (WO-107) · the report gate (WO-110) ·
retries, durability, or workflow engines (ROADMAP debt #17 — trigger-gated, not now).

**The core design call — decide in the order, not in the builder's head.** Are edges written
(a) by a generic `link` command, or (b) as link fields on the creation input, written in the
same transaction as the row?

*Recommendation: (b).* Canvas-seam Law B is write-path singularity, and the One Rule says the
Kernel owns truth. Option (b) keeps one write path and makes an edge atomic with its node — a
run cannot exist for one instant unattached to its hypothesis. Option (a) adds a second write
verb and permits orphan states the ontology has no way to describe. If the order author picks
(a), the burden is to explain what an orphan node *means*.

**Gate.**
1. The full six-stage chain is created and linked through `execute()`, and a raw SQL read shows
   the expected rows **and** the expected edges in `links`.
2. **Bait:** an illegal edge (a `kind` outside the CHECK, or a `from_id` of the wrong type) is
   rejected — red — restore — green.
3. `qa/run.ts --all` green; `kernel-sole-writer` still passes, proving the new writes went
   through `execute()` and not around it.
4. Zero actions defined-but-unwired remain, or each survivor is named in the report with the
   rung that will wire it.

**What this rung must resolve before WO-104 can be written.** The exact traversal shape — given
an object id and a link kind, what comes back, in which direction, and how is the reverse
direction named. WO-104's tools are generated from that answer.

---

## P3 · The generated tool plane

The rule for this whole phase: **tools fall out of the schema.** A tool that had to be
hand-written is a schema that failed to describe itself.

### WO-104 · Read tools, generated

**Objective.** An MCP-speaking agent can read the entire graph — objects and edges — through
tools nobody hand-wrote, served by a real process.

**Depends on.** WO-103 (traversal shape; and empty tables prove nothing).

**Start from what already exists** — this rung is smaller than it looks in the old ladder.
`generateMcp()` (`src/generate/mcp.ts:34`) **already emits** `qf_<object>_get` and
`qf_<object>_query` for all 19 objects plus one tool per action — 65 definitions in
`golden/tools.json`.

**In.**
- **Traversal tools.** 13 link types, zero tools today. This is the actual new generation work.
- **Real filters.** `queryInput` is `limit` + `offset` only, yet every generated description
  says *"List X rows with optional filters."* There are no filters. **The lie is pinned by a
  test** — `generate.test.ts:66` asserts that exact wording. Either filters become real or the
  description tells the truth; a description that misleads an agent is a schema defect by
  doctrine, and this one is currently test-enforced.
- **A running server.** `golden/tools.json` is a definitions file; nothing binds a tool name to
  a Kernel read. Use `tools/qf-peer-bus/src/server.ts` as the working in-repo template —
  `McpServer` + `StdioServerTransport`, dependency already present.

**Out.** Write/action tools (WO-105) · authz or deny-lists · any hand-written per-type tool.

**Gate.** Add a brand-new object type to the schema, regenerate, and **its get / query /
traverse tools exist and answer with zero hand-written tool code.** That is the falsifiable
claim — not "tools exist," but "tools appear for a type nobody anticipated."

### WO-105 · Action tools and the two gates

**Objective.** Every write tool is one dumb tool between two checks. **The agent proposes; the
ontology permits.**

**Depends on.** WO-103 (the writes) and WO-104 (the server).

**In.** GATE 1, input: Zod validates the call shape before anything touches the Kernel. GATE 2,
output: the transition table validates the result before it commits.

**Measured starting point.** GATE 2 substantially exists — `execute()` calls `assertTransition`
at `execute.ts:128` and throws `IllegalTransitionError`. **GATE 1 does not** — `execute()` takes
`input: Record<string, unknown>` and never validates it against the action's declared Zod
schema. The action schemas exist and are already exported as JSON Schema to MCP; they are simply
not enforced at the boundary. That gap is this rung's core.

**Out.** New actions · policy or permission systems beyond the two gates · retries.

**Gate.** Both proven **by bait**, both directions: a malformed call dies before the Kernel sees
it; an illegal transition dies before commit. Neither may be provable only by reading code.

### WO-106 · The cold seat, and retirement

**Objective.** A live agent seat, given no priming, finds and uses the generated tools to
complete a real task — and the hand-written verbs it replaces are deleted.

**Depends on.** WO-104, WO-105.

**In.** One cold seat, one real task, tools discovered from the MCP surface alone. Hand-written
tool code deleted as its generated replacement lands.

**Out.** Multi-agent anything (P5) · new capability of any kind.

**Gate.** The cold seat finishes the task through generated tools only, with no prompt naming a
tool. **Deletion is part of the gate** — a replaced verb still in the tree means the rung is not
done. Two tools for one job is the second-truth-store rule wearing a different hat.

---

## P4 · Real data

### WO-107 · One pipeline, one market

**Objective.** Real instruments, quotes and market events land in the Kernel through commands,
carrying an ingest trace. The canvas stops being an empty engine.

**Depends on.** WO-102 (vocabulary), WO-103 (writes).

**In.** One venue, one market, one scheduled ingest, every row traceable to an ingest event.

**Out.** A second market (WO-108) · strategies or signals over the data · anything that resembles
placing a stake, at any rung, ever.

**Gate.** Every row traces back to an ingest event, and a seat answers a question about **real**
data through generated tools.

### WO-108 · The second market

**Objective.** Prove the market abstraction by loading something structurally unlike the first —
a game line and a perpetual future through the same four types.

**Depends on.** WO-107.

**Gate — the sharpest on the ladder.** **Zero new object types.** If either market needs a
special type, the abstraction failed, and fixing it *is* this order. Do not let a "small
exception type" through; that is precisely the failure this rung exists to detect.

---

## P5 · The loop runs itself

### WO-109 · The loop's lower half

**Objective.** Orchestrator and workers run `hypothesis → dataset → run → artifact` across the
peer bus, every step a Kernel action, every conversation a trajectory artifact.

**Depends on.** WO-105, WO-107. Uses the existing `tools/qf-peer-bus`.

**Out.** The critic (WO-110) · durable execution (debt #17 — the trigger is the first
orchestrator run that dies mid-flight and cannot resume; not before).

**Gate.** The chain completes with every step **recorded, not narrated**. A transcript saying it
happened is not evidence; Kernel rows and edges are.

### WO-110 · The critic, and the refusal

**Objective.** A critic seat scores artifacts against the hypothesis's own criteria, and
publication becomes mechanically impossible without a passing evaluation. **This is where the
gate cut from WO-101 finally lands** — here it is buildable, because evaluations can be recorded
and edges can be written.

**Depends on.** WO-103 (recordable evaluations, writable edges), WO-109.

**In.** A critic seat · `record_evaluation` wired · `publish_artifact` refuses `kind: "report"`
unless a linked evaluation with **`verdict === "supports"`** exists.

**Two decisions the order must make, not the builder.**
1. **No confidence floor.** `evaluation.confidence` is a 0–1 field; the *bar* belongs in
   `hypothesis.success_criteria`, which already exists. Putting a magic number in the Kernel
   hard-codes a research judgment into a type system. `verdict` is the predicate.
2. **Report is `artifact.kind`, not a type.** `artifact`'s description already says so. A
   `Report` object type fails WO-101's Silo lint.

**Out.** Recall, ranking, or retrieval quality · RL of any kind.

**Gate.** `publish_artifact` with `kind: "report"` refuses without a passing evaluation —
**bait-tested**, both directions. Publication must be impossible by machine, not by discipline.

### WO-111 · The one-shot proof

**Objective.** Ask the orchestrator one question that spans the whole graph and let it answer
unaided.

**Depends on.** everything.

**Gate.**

> *"What did the last run on hypothesis X show, which evaluation gated it, and should we re-run
> against the newer dataset?"*

Correct, one pass, tools only, fully recorded. Every clause is a traversal across a different
plane — which is exactly why this question was unanswerable before WO-103, and why it is the
right closing test.

**This is the finish line.** The day an agent does real cross-object work through tools that
fell out of the schema is the day QuantFlow stops being a platform with an ontology attached and
becomes one. Recall, evolution and RL come after — they are **consumers** of this, not
prerequisites for it.

---

## Standing constraints on every rung

- **Research and advisor only.** QuantFlow proposes, backtests, criticizes, evaluates, reports.
  The operator places every bet and trade. No rung relaxes this.
- **Local, on the tower.** Tailscale for remote reach. The client/server seam exists if it is
  ever needed; it is not needed.
- **One order at a time, verified by someone who did not build it.**
- **A gate that has only ever been green is decoration.** Falsify it or it does not count.
- **Substrate proposals get logged, not evaluated** (`START_HERE.md` §5.8). The ecosystem ships
  one a week; none of them advance the world model.
