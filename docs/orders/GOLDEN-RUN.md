# GOLDEN-RUN.md — the definition of done, and the route to it

> **This is the route, not the authority.** `NEXT.md` names the one active rung and is the only
> thing that authorizes work (DOCTRINE A9). A rung described here is a contract waiting to be
> selected, never permission to start. If this file and `NEXT.md` disagree about what is active,
> `NEXT.md` wins.
>
> Written 2026-08-03. There is exactly one route document. If a second appears, one of them is wrong.

---

## Part I — The golden run

QuantFlow v1 is done when the founder can sit down at a Windows machine and watch this happen.

> **You type a research question into the canvas.**
>
> 1. The **orchestrator reads the Dock** — it queries the catalog and sees which agents are
>    available: a Hermes researcher, a Claude Code analyst, a Hermes critic.
> 2. It decides it needs two of them and **spawns them**. Two new tiles appear on your canvas —
>    because a session is a Kernel object, and tiles render Kernel objects.
> 3. It **creates tasks and assigns them**. Cables appear between the tiles — because assignment is
>    a link, and links render as cables.
> 4. A worker **queries the market ontology**, does its work, and **publishes an artifact**. An
>    artifact tile appears, wired to the session that produced it.
> 5. The orchestrator sees the result and **closes the seats**. Tiles go to stopped. Cables stay.
>
> **You close the app. You reopen it. Everything is still there** — because none of it lived in the
> UI. The canvas was reading the Kernel the whole time.

### Why this is the goal and not something more ambitious

Because it is **observable**. You can watch it succeed or watch it fail, without reading code, a
report, or a status table. Every previous definition of done in this repository was a claim someone
had to be trusted about. This one is a demonstration.

It is also the prerequisite for everything else the founder wants. Reinforcement learning, PufferLib,
multi-harness research, automated analysis — all of them are *things you point an orchestrator at*.
None of them are reachable until an orchestrator can read a catalog, hire a specialist, hand it work,
and collect a durable result. **The canvas concept is not a detour on the way to the research
product. It is the machine the research product runs on.**

### What the golden run deliberately does not include

No dataset fencing, no backtest, no critic, no gated report. Those are the research loop — Part III.
The golden run proves the *desk* works. Part III proves the *research* works. Conflating them is how
the last four plans died.

---

## Part II — Where the floor actually is

State these by running them, never by trusting this file:

```bash
bun qa/verify-release.ts     # the canonical release gate
bun qa/run.ts --list         # every registered gate
cd qf-kernel-schema && bun test && bun run generate   # schema + regenerate golden/
```

**Verified and shipped:** a typed Kernel with one write path (`execute()`), a generated tool plane
(reads, actions, and the conformance suite all fall out of the schema), a packaged Windows app that
boots, a Dock that spawns real Hermes CLI seats through WSL, durable task/result handoffs recorded as
Kernel artifacts, canvas projection, close/reopen recovery, and clean shutdown.

**The gap that defines the whole plan:** the generated ontology tools are **not connected to any
seat**. `tools/qf-read-tools` serves them; nothing in the running app consumes it. Agents today get a
mailbox and no world. Closing that is R1, and every rung after it depends on R1 existing.

**Known open items, carried honestly:** the legacy ACP surface denies permissions but still exposes
unconfined file read/write (R7). `resolve_hypothesis` and `publish_artifact` have no evidence guards
despite descriptions implying otherwise (R9). Line endings are inconsistent across the index, which
makes the byte-exact `golden/` drift tests platform-bound. `docs/DEBT.md` carries the rest.

---

## Part III — The route

Sizes are honest. **Small** is days. **Medium** is a week or two. **Large** is a program, and saying
so up front is the point — a flat-looking ladder is how month three starts feeling like failure.

### Act I — the desk (the golden run)

| # | Size | Proves | Scenario step |
|---|---|---|---|
| **R0** | Small | The latest collaboration works from an *installed* Windows build and is on GitHub | floor |
| **R1** | Medium | A Dock seat can call generated ontology tools through an app-owned gateway | enables all |
| **R2** | Medium | The Kernel decides which tools a role receives, and seats have operating instructions | enables 1–2 |
| **R3** | Medium | An orchestrator reads the real Dock and spawns a real seat; the tile appears because the Kernel says so | **1–2** |
| **R4** | Medium | A second harness (Claude Code) works through the identical contract | 1–2 |
| **R5** | Medium | Delegation is durable objects, not messages — the work survives the transcript | **3** |
| **R6** | Medium | A real agent answers a real market question with cited Kernel lineage | **4** |
| **R7** | Small | Nothing approves on the founder's behalf; the legacy file surface is closed | safety |
| **R8** | Small | The founder can type the question that starts it | **0** |

**Act I complete = the golden run happens.** Steps 5 and 6 (closing seats, reopen persistence) need
no rung of their own — session lifecycle actions already exist, and Law A already guarantees the
reopen.

### Act II — the research loop (what you point it at)

| # | Size | Proves |
|---|---|---|
| **R9** | Medium | The Kernel refuses an unsupported hypothesis resolution and an ungated report |
| **R10** | Medium | A point-in-time Dataset is immutable, hashed, and rejects future data |
| **R11a** | Medium | Execution is deterministic — same strategy, same Dataset, same result hash |
| **R11b** | Large | The quantitative metrics are *correct*, proven against a hand-calculated fixture |
| **R12** | Large | An independent critic evaluates, and a Report cannot publish without a passing Evaluation |

### Act III — after there is history to learn from

| # | Size | Proves |
|---|---|---|
| **R13** | Large | Domain tiles, semantic cables, workflow recovery, onboarding, signed release |
| **R14** | Large | Recall over real Evaluation history; RL — Track A playbook first, Track B weights after |

R14 is last because it is *downstream*, not because it is unimportant. Evaluation history cannot
become a fitness function before evaluation history exists. The schema hooks are already seeded —
`policy`, `environment`, and `run.kind: "training"` all exist today.

---

## Rung status — the single source of truth

**Machine-checked.** `bun qa/run.ts rung-ladder` fails if this table and `NEXT.md` disagree, if more
than one rung is `active`, if a `complete` rung has no evidence directory, or if a rung is marked
`complete` while an earlier one is not. Edit this table and `NEXT.md` in the same commit or the gate
goes red. **Do not describe rung state anywhere else** — link here instead.

| Rung | State | Evidence |
|---|---|---|
| R0 | active | `docs/orders/evidence/r0` |
| R1 | pending | — |
| R2 | pending | — |
| R3 | pending | — |
| R4 | pending | — |
| R5 | pending | — |
| R6 | pending | — |
| R7 | pending | — |
| R8 | pending | — |
| R9 | pending | — |
| R10 | pending | — |
| R11a | pending | — |
| R11b | pending | — |
| R12 | pending | — |
| R13 | pending | — |
| R14 | pending | — |

### Closing a rung

A rung moves `active` → `complete` only when all of these hold, in this order:

1. Its acceptance commands run green, pasted unedited.
2. Every gate it added has been falsified — broken on purpose, seen red, restored, seen green — and
   both outputs are in the record.
3. An evidence file exists under `docs/orders/evidence/<rung>/` stating what was proven **and what
   was not**.
4. `bun qa/verify-release.ts` passes.
5. This table and `NEXT.md` are updated in the same commit.

**Founder-gated rungs stop for human eyes.** R3, R6, and R8 change what the founder sees on the
canvas, and their acceptance is not fully expressible as a command. A builder reaching the end of one
of those posts its evidence and **stops**; it does not mark itself complete. Every other rung in
Act I closes on gates alone, and a builder may advance itself through them — the check is a
falsifiable test, not the builder's opinion, so this does not violate the no-self-approval rule.

## Part IV — Rung contracts

Written one rung ahead of the build front. A rung with no contract here is not ready to be selected.

### R0 — installable collaboration floor · ACTIVE

**Proves.** The Windows app you install — not `bun run dev` — spawns real Hermes seats that exchange
a real task and result, and the work is backed up on GitHub.

**Remaining.** Two blockers, both external to the code: the Hermes provider rate limit, and the
founder's manual keyboard-input check. Everything else has commits.

**Acceptance.** From the installed application: app opens even with no Hermes available; Dock shows
accurate availability; two real seats spawn; both receive only launch-scoped config; one task and one
result travel through the app-owned MCP; the canvas shows the durable receipt; normal close leaves no
processes; reopen shows stopped seats with the collaboration intact; the founder's global Hermes
config and authentication are provably untouched; branch pushed.

**Carried risk.** Acceptance runs through automated TUI input, which is known to enter partial text.
A red result must be diagnosed as product-or-harness before it counts as a failure.

### R1 — the ontology gateway

**Proves.** A Dock-spawned seat can call a generated `qf_*` tool and get real Kernel data back.

**Deliverables.** An app-owned MCP server exposing the generated tool surface. Calls resolve inside
the app; a seat never holds a database handle. Designed **stateless** — no session state on the
server, caller identity carried per request, which is where MCP is going and which is what makes R2
enforceable. Every tool call recorded as a trajectory artifact.

**Acceptance.** Spawn one seat. It calls a generated read tool. The returned object ids match a
direct Kernel query. Falsify: point the seat at a database the app does not own — the call is
refused, exactly as the peer-bus handler already refuses a foreign `busDb`.

**Out of scope.** Writes. Role scoping. A second species.

### R2 — capability grants and operating instructions

**Proves.** The Kernel decides which tools a role receives, and a seat knows what it is for.

**Deliverables.** A schema home for role capabilities — `agent_definition` has no capability field
today and no link joins a profile to a `tool`, so this is a schema change with a regenerated
`golden/` and an upgrade. Capability *groups* (`market.read`, `desk.orchestrate`), never hand-listed
tool names — a hand-maintained roster is a second truth store about the ontology and will drift from
`golden/` exactly as the docs did. Plus written system prompts, pointed at by `system_prompt_ref`,
which is currently null on every profile in the repo.

**Acceptance.** An orchestrator profile receives desk tools; a worker profile does not. Falsify: the
worker attempts a spawn and is refused. Add a new object type to the schema, regenerate, and confirm
the matching capability group picks it up with no hand edit.

**Open question for the founder.** Every schema entity is still `experimental`, and no promotion
authority is defined (`docs/DEBT.md` #19). This rung is when that has to be decided.

---

## Standing constraints — no rung relaxes these

1. **The Kernel owns truth.** One write path. No new truth stores, ever.
2. **Research only.** QuantFlow never places a bet or executes a trade.
3. **Windows first.** Native Windows 11 is the acceptance platform (ADR-0001).
4. **No self-approval.** The agent that built a change is never its verifier.
5. **No work without an order.** `NEXT.md` names it, or it does not happen.
6. **A gate you did not falsify is not a gate.** Red on purpose, then green.
7. **Never handle credentials.**
8. **Proof must be real.** A fixture presented as live capability is an incident, not a delivery.
