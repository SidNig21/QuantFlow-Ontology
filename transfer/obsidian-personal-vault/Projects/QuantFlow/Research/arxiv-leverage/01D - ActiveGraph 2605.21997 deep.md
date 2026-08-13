---
tags: [quantflow, research, arxiv, deep-read]
created: 2026-07-27
paper: 2605.21997
retrieved: "https://arxiv.org/html/2605.21997v1"
---

# ActiveGraph (2605.21997) — deep read

**Actual title:** "The Log is the Agent: Event-Sourced Reactive Graphs for Auditable, Forkable Agentic Systems." **Author:** Yohei Nakajima (creator of BabyAGI — the paper explicitly frames itself as BabyAGI's successor architecture). Abstract cross-checked separately at `https://arxiv.org/abs/2605.21997`; consistent with the full text.

See also: [[01 - ActiveGraph 2605.21997]] (first-pass note — still correct; this read adds the mechanism detail and the evidence-quality caveat there wasn't room for) · [[07 - Endless Terminals 2601.16443]] · [[09 - CEO-Bench 2606.18543]].

## 1. What the paper actually does

Core data structure: an append-only **event log**. Each event carries `{id, type, payload, actor, caused_by (optional pointer to the triggering event), timestamp}`. A **graph** — typed objects and relations — is never mutated directly; it is computed by *folding the event log forward* (`graph = fold(events, apply_event, initial_state)`). This is the paper's One Rule, stated plainly: "The append-only event log is the source of truth; the working graph is a deterministic projection of that log."

**Behaviors** are the only active component, and there is no orchestrator. A behavior = `{subscription: (event_type, predicate?, graph-shape pattern in a Cypher subset), body: fn(match) → may create objects/relations, call tools/models, emit new events}`. Four flavors: plain function, stateful class, LLM-backed routine, and relation-behavior (attached to a typed edge, fires when its endpoints change). Control flow is "an emergent consequence of which events match which subscriptions" — structurally a blackboard/production-rule system, which the paper explicitly cites as ancestry, updated with LLM-backed rules instead of hand-coded ones.

**The determinism contract**, stated as hard rules on behavior bodies: no direct reads of wall-clock time, `random()`, or fresh UUIDs (must come from the triggering event's recorded timestamp or the runtime's deterministic ID generator); no I/O outside the framework's own tool/model-call primitives; no dependence on mutable global state that changes between fires. One explicit, load-bearing exception: LLM calls go out live the first time, and the *response* is recorded as an event (`llm.responded`); the contract binds *replay*, not the original call — on replay, the cached recorded response is served rather than a fresh call issued.

**Content-addressed response cache**: keyed by a deterministic hash of `(system message, user messages, model id, tool defs, output schema)` for model calls, or `(tool name, hash(args))` for tool calls.

**Replay, two modes.** *Permissive* (default): events re-emitted in log order; a re-fired request whose hash matches a recorded one is served from cache; a request with a changed hash gets a fresh call and produces a *new* event (so "replay with edits" is a supported operation, not an error). *Strict*: behaviors are made to re-fire against the recorded log and the runtime diffs the resulting live event stream against the originally recorded stream — any divergence raises an error pinned to the first differing event. Quoted directly: "A green strict replay is a proof that the run is reproducible."

**Forking**: choose a cutoff event N in a run's log; copy the prefix into a new run; every model/tool call referenced in that prefix is served from the content-addressed cache at zero cost; live execution resumes only at N+1, potentially with changed parameters. Cheap specifically because the shared prefix is never re-executed, only replayed from cache.

**Structural diff**: because any two runs both project to a graph from their own logs, diffing two runs is just diffing two graphs' object/relation sets — well-defined because both sides came from the same projection mechanism.

**Safety valves**: per-run budgets (event count, behavior-call count, model-call count, recursion depth, wall-clock ceiling, cost ceiling) guard the no-central-scheduler design against reactive cascades.

**Worked example** (the paper's only empirical artifact): a due-diligence pipeline — company name in, chained behaviors generate research questions → research each → extract claims/evidence → detect contradictions → identify risks → synthesize a memo. A concrete run: 671 events, 93 objects (3 companies / 24 questions / 9 documents / 25 claims / 25 evidence items / 1 contradiction / 3 risks / 3 memos), 76 relations, 103 model calls, 48 tool calls, **zero orchestration code**, and two independent runs produce byte-identical logs. Every claim object carries a provenance block naming the exact behavior, causing event, and model-call event that produced it.

## 2. Evidence quality

This is explicitly not an empirical paper, and the authors say so directly: "We do not report that ActiveGraph improves task accuracy over any baseline; the contribution is the substrate and its guarantees." There is no comparison to any other agent framework, no task-performance metric, no user study — the only evidence offered is that the mechanism runs, and that two runs of one worked example are byte-identical (a real, checkable determinism claim, but a claim about the *plumbing*, not about whether the resulting agent is any good). Section 7 ("self-improving agents") is explicitly hedged: "We discuss — without claiming to demonstrate — why this substrate is unusually well suited to self-improving agents." Weaknesses worth naming: single author, single worked example, no adversarial stress-testing of the determinism contract at any scale, and no discussion of what happens to cache validity when the underlying model version changes (a "hit" against a stale model's cached response is treated as equivalent to a fresh call from the current model, which is not obviously safe). Rate this: strong, checkable claim about mechanism ("replay is exact on this example"), essentially zero evidence about outcome quality.

## 3. The transferable pattern

(a) **Strict replay as an independent verifier.** Reconstruct state twice, through two genuinely different processes — "what was recorded" (the log) versus "what re-deriving from the log actually produces right now" (fold/replay through the live command logic) — and treat divergence as a hard failure pinned to the exact point of disagreement. The two sides of this check share no common source.

(b) **A determinism contract as an enforceable rule on command/behavior authors**, not an aspiration: named, lintable constraints (no direct wall-clock/random/UUID reads, no I/O outside declared primitives, no floating global state), with one explicit, deliberate carve-out for the one genuinely nondeterministic primitive (the live model call), recorded once and replayed from cache thereafter.

## 4. Applies to QuantFlow how

Directly at the gate-blindness wound. WO-V1's round-1 crash happened because the schema-drift gate's "expected" side and "actual" side were **both derived from `schema.ts`** — nothing independent existed to disagree with the live `kernel.db`. Strict replay names the fix precisely: a gate that (1) starts from a fresh, empty SQLite file, (2) replays real previously-recorded commands through the actual `execute()` path — not a re-parse of the schema — and (3) asserts the resulting `sqlite_master` shape matches the live `kernel.db`'s actual shape. Both sides of that check come from "what the code really does when run" and "what's really on disk"; neither comes from the schema file. That would have caught the 23-vs-16 mismatch immediately. This is a concrete, currently-unnamed gate design — it belongs alongside WO-103's `typecheck` gate addition, and is worth proposing as a standing debt item before WO-107 puts a real external feed writing through this path for the first time.

Secondarily, for WO-109 (the recorded loop): the provenance-chain idea — "this claim came from this behavior, caused by this event, produced by this exact model call" — is the same shape WO-111's closing question demands ("which evaluation gated it"). If Kernel events and peer-bus trajectories ever carry an explicit `caused_by` pointer alongside existing content-addressing, WO-111's one-shot proof becomes a log traversal rather than an agent's summary of its own work — exactly the "recorded, not narrated" bar WO-109's gate already sets.

The fork-by-log-offset idea from [[01 - ActiveGraph 2605.21997]] stands; this read supplies the concrete "how" that note's checklist lacked — the cache-key formula (hash of system/user messages + model id + tool defs + output schema, or tool name + arg hash) is the reusable piece if `fork_run` is ever specced as a Kernel action, not the ActiveGraph runtime itself.

## 5. Where it conflicts with doctrine

ActiveGraph, in full, is a runtime you install: a reactive engine that owns its own event log and computes its own graph projections. Adopting *that* — the actual package — beside the Kernel would be a second system of record by definition (a second append-only log claiming to be the source of truth) and a second AgentOS chassis riding beside the substrate that is already built. Both hard constraints are violated by literal adoption. Nothing here should be installed; strict replay and the determinism contract are fully re-expressible as Kernel gate scripts and `execute()`-boundary lint rules, which is the only form this note recommends.

## 6. Verdict

`adopt-pattern` — strict replay (independent reconstruction vs. live state, never schema vs. schema) is the single most direct, implementable fix for the exact failure mode this research was commissioned to address, and it costs a gate script, not a runtime.
