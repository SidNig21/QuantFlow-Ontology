# GOLDEN-RUN.md — the definition of done, and the route to it

> **This is the route, not the authority.** `NEXT.md` names the one active rung and is the only
> thing that authorizes work (DOCTRINE A9). A rung described here is a contract waiting to be
> selected, never permission to start. If this file and `NEXT.md` disagree about what is active,
> `NEXT.md` wins.
>
> Written 2026-08-03. There is exactly one route document. If a second appears, one of them is wrong.

---

## Part I — The golden run

1. Ryan asks the custom Hermes Research Director about one bounded upcoming sports market and names the Technique/Strategy version to use.
2. A durable Mission appears immediately. The Director reports supported data coverage or a visible refusal; it never fabricates unavailable coverage.
3. The Director uses governed actions to recruit exact specialist sessions and assign durable Tasks. The canvas shows the plan, owners, status, and reasons.
4. Ryan can clarify, redirect, reassign, cancel, or request a second opinion; each accepted action or refusal is visible and recorded by the Kernel.
5. Workers publish cited evidence and an Artifact. An independent critic reads the exact Hypothesis, Dataset, Run, Artifact, and metrics before recording an Evaluation. Publication remains evaluation-gated.
6. The Director returns a candidate or explicit no-candidate result with source times, method, uncertainty, lineage, and a statement that no bet was placed.
7. After close/reopen, the Mission, sessions, Tasks, evidence, Evaluation, result, and steering history remain available from the Kernel.

For this route contract, terms have one meaning:

- **bounded market** = one `market_event` plus the related `instrument` and timestamped `quote` rows admitted in one point-in-time Dataset;
- **named Technique/Strategy version** = a stable Strategy id, version, and content hash selected by Ryan or retrieved with lineage; absence produces the coverage refusal in step 2;
- **exact specialist** = a capability-selected `agent_definition` instantiated as one named `agent_session`; every Task assignment and handoff stores that session id, never only a role or species string;
- **steering** = all five founder controls named in step 4 are supported; the final product demonstration exercises at least one accepted control and one refused invalid control, both with zero UI-only durable state;
- **cited result** = Kernel object ids for the data read, observation/source timestamps, Artifact content hashes, and durable links from the Run through Evaluation to the Report;
- **close/reopen** = terminate the QuantFlow Windows application process and launch it again against the same canonical Kernel.

Conversation is the front door. The canvas is the visible and steerable operating surface. The Dock is optional manual control. The Ontology is the durable world. Quantitative research is the first domain. Learning compounds the evidence.

Ryan may perform the same governed actions manually from the Dock and canvas. That is an alternate control path, not a prerequisite. Fixtures prove plumbing; only real data and real model turns prove research judgment.

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

**The remaining Act I gap:** Dock seats already reach generated ontology tools through the app-owned
gateway, but the question, hire, task, result, and canvas proofs were built as separate slices. The
pre-R9 golden-path repair makes those existing seams one continuous packaged workflow. It does not
claim live market data or research judgment.

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

R10, R11a, R11b, and R12 create the substrate R18 needs: immutable point-in-time datasets,
deterministic execution, validated quantitative outcomes, and independent Evaluation history. Recall
or learning has no honest fitness signal until those facts exist in the Kernel.

### Act III — Windows v1 release

| # | Size | Proves |
|---|---|---|
| **R13** | Large | Windows v1: an installable current build, and one seat that finishes a governed research run |

**R13's scope was narrowed on 2026-08-12.** It previously also carried domain tiles, semantic cables,
and workflow recovery. Those are founder-facing operating-console work and moved to Act IV, because
a release rung that also redesigns the canvas cannot close. R13 now delivers two things: a product
you can install, and proof the existing research loop survives a real model. Its orders are
`WO-V2-1` and `WO-V2-2`.

### Act IV — governed research world

| Rung | Outcome |
|---|---|
| **R14** | Research Director: one custom Hermes profile turns a founder mission into visible, exact-session governed work and accepts steering |
| **R15** | Governed review: an exact critic reads the evidence, records an Evaluation, and visibly gates publication |
| **R16** | Visible research world: active Mission, Task, Dataset, Run, Artifact receipt, Evaluation, and result are inspectable without reading terminal logs |
| **R17** | Technique and outcome loop: versioned Strategy/Technique drives forward research; settled operator-supplied outcomes grade calibration and CLV without placing bets |

Act IV makes the Research Director experience visible, governed, reviewable, and steerable. Manual
Dock and canvas actions remain supported as an alternate control path, but they are not the default
front door. Scope detail lives in [`../proposals/V2-SCOPE.md`](../proposals/V2-SCOPE.md), which is a
source record and confers no route or build authority.

### Act V — learning and recall

| Rung | Outcome |
|---|---|
| **R18** | Recall: prior evaluated work is retrieved with lineage and never becomes truth merely because it was retrieved |
| **R19** | Market learning: an RL worker runs a PufferLib Environment, publishes a Policy Artifact, and held-out Evaluation gates founder-controlled promotion/rollback |
| **R20** | Harness learning: Evaluation history may improve versioned playbooks first and owned-model weights second without creating a second truth store |

R18 depends on the independent Evaluation history established by R15–R17. R19 is the first-class
market-learning destination: its RL worker is a governed Dock seat and PufferLib is workload inside
the governed RL worker Run, not the application chassis. R19 depends on fenced Datasets, validated
research outcomes, the Windows product floor, and durable governed work; held-out Evaluation gates
founder-controlled promotion or rollback. R20 is secondary harness learning and may improve
versioned playbooks before owned-model weights, while the Kernel remains the sole truth store.

---

## Rung status — the single source of truth

**Machine-checked.** `bun qa/run.ts rung-ladder` fails if this table and `NEXT.md` disagree, if more
than one rung is `active`, if a `complete` rung has no evidence directory, or if a rung is marked
`complete` while an earlier one is not. Edit this table and `NEXT.md` in the same commit or the gate
goes red. **Do not describe rung state anywhere else** — link here instead.

| Rung | State | Evidence |
|---|---|---|
| R0 | complete | `docs/orders/evidence/r0` |
| R1 | complete | `docs/orders/evidence/r1` |
| R2 | complete | `docs/orders/evidence/r2` |
| R3 | complete | `docs/orders/evidence/r3` |
| R4 | complete | `docs/orders/evidence/r4` |
| R5 | complete | `docs/orders/evidence/r5` |
| R6 | complete | `docs/orders/evidence/r6` |
| R7 | complete | `docs/orders/evidence/r7` |
| R8 | complete | `docs/orders/evidence/r8` |
| R9 | complete | `docs/orders/evidence/r9` |
| R10 | complete | `docs/orders/evidence/r10` |
| R11a | complete | `docs/orders/evidence/r11a` |
| R11b | complete | `docs/orders/evidence/r11b` |
| R12 | complete | `docs/orders/evidence/r12` |
| R13 | active | `docs/orders/evidence/r13` |
| R14 | pending | — |
| R15 | pending | — |
| R16 | pending | — |
| R17 | pending | — |
| R18 | pending | — |
| R19 | pending | — |
| R20 | pending | — |

### Closing a rung

A rung moves `active` → `complete` only when all of these hold, in this order:

1. Its acceptance commands run green, pasted unedited.
2. Every gate it added has been falsified — broken on purpose, seen red, restored, seen green — and
   both outputs are in the record.
3. An evidence file exists under `docs/orders/evidence/<rung>/` stating what was proven **and what
   was not**.
4. R9–R12 run one focused local product proof plus the relevant invariant checks.
   R13 runs the complete `bun qa/verify-release.ts`, packaged Windows, and visible
   consumer proof once, so research rungs do not repeatedly rebuild the same app.
5. This table and `NEXT.md` are updated in the same commit.

**Founder-gated rungs stop for human eyes.** R3, R6, and R8 change what the founder sees on the
canvas, and their acceptance is not fully expressible as a command. A builder reaching the end of one
of those posts its evidence and **stops**; it does not mark itself complete. Every other rung in
Act I closes on gates alone, and a builder may advance itself through them — the check is a
falsifiable test, not the builder's opinion, so this does not violate the no-self-approval rule.

## Part IV — Rung contracts

Written one rung ahead of the build front. A rung with no contract here is not ready to be selected.

### R0 — installable collaboration floor · COMPLETE

**Proves.** The Windows app you install — not `bun run dev` — spawns real Hermes seats that exchange
a real task and result, and the work is backed up on GitHub.

**Closed.** Founder-Hermes-state is gated by `hermes-founder-state` (hashes only). Hermes-unavailable
boot and mid-work cancel closed 2026-08-04 (`docs/orders/evidence/r0/`).

**Acceptance.** From the installed application: app opens even with no Hermes available; Dock shows
accurate availability; two real seats spawn; both receive only launch-scoped config; one task and one
result travel through the app-owned MCP; the canvas shows the durable receipt; normal close leaves no
processes; reopen shows stopped seats with the collaboration intact; the founder's global Hermes
config and authentication are provably untouched; branch pushed.

**Carried risk.** Acceptance runs through automated TUI input, which is known to enter partial text.
A red result must be diagnosed as product-or-harness before it counts as a failure.

### R1 — the ontology gateway · COMPLETE

**Proves.** A Dock-spawned seat can call a generated `qf_*` tool and get real Kernel data back.

**Closed.** App-owned gateway + `windows-dock-ontology` gate. Evidence: `docs/orders/evidence/r1/`.

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

### R3 — the orchestrator hires

**Proves.** An orchestrator seat reads the real Dock catalog, creates and starts a session, and a
tile appears on the canvas **because the Kernel says so** — not because anything told the UI to draw
it. Golden run steps 1 and 2.

**Deliverables.** `qf_agent_definition_query`, `qf_create_agent_session`, and `qf_start_agent_session`
reachable from an orchestrator seat through R1's gateway, scoped by R2's capability groups. The
canvas renders a tile for any `agent_session` row it did not create itself. Each session carries a
`spawned_from` link to the definition it came from.

**Acceptance.** Runnable end to end. Spawn an orchestrator. It calls the catalog tool and receives
the real `agent_definition` rows. It creates and starts a session for a named definition. Assert: the
session row exists, its `spawned_from` link resolves to that definition, and the canvas projection —
**queried, not screenshotted** — lists a tile bound to that session id. Then write a session row by
direct Kernel command with the app running and assert the tile still appears; that is the real test
of "the canvas reads the Kernel."

**Falsify.** Drop the `spawned_from` write — red. Make the tile render from UI state instead of a
Kernel query — the Law E / `no-canvas-domain-writes` gate goes red.

**Out of scope.** The orchestrator *choosing* which agent to hire by its own judgment — that is
prompting, not plumbing. Task assignment, which is R5.

**Founder review — queued, does not block.** You should see a tile appear that you did not click.

### R4 — a second species

**Proves.** Claude Code CLI works through the identical contract as Hermes, with no Hermes-shaped
special case anywhere in the path.

**Deliverables.** An adapter package and `agent_definition` rows for a Claude Code profile. The same
launch path, the same R1 gateway, the same R2 capability grants. Claude Code speaks MCP natively, so
the gateway should need no new transport.

**Acceptance.** Spawn a Claude Code seat from the normal Dock. It calls the same generated read tool
a Hermes seat calls and receives the same result shape. Both sessions appear as distinct Kernel rows
with correct `spawned_from` links.

**Falsify.** Hardcode a `"hermes"` literal into the shared launch path — the existing species-literal
scan in `dock-registry` goes red. Point the Claude Code seat at the gateway with no capability grant
— refused.

**Out of scope.** Claude Code doing research. Tool-for-tool parity between species.

### R5 — delegation is durable objects

**Proves.** Assigned work survives the transcript. Kill both seats mid-task, reopen, and the task is
still there, still assigned, with its state. Golden run step 3.

**Deliverables.** Task creation and assignment as **Kernel objects and links**, not messages — a
`task` row plus an assignment link, which is what makes cables render between tiles. Task state moves
through `execute()` like everything else. The peer bus may still *notify*, but it stops being where
meaning lives.

**Acceptance.** An orchestrator creates a task and assigns it to a worker; assert the link row
exists. The worker transitions it to done; assert the event log records the transition. Close the
app, reopen, and assert the task, the link, and the state are all intact and the cable renders.

**Falsify.** Carry the assignment only as a peer-bus message — reopen loses it, gate red. Attempt an
illegal state transition — the Kernel refuses and writes nothing.

**Out of scope.** Scheduling, retries, priorities, deadlines.

### R6 — a real answer with real lineage

**Proves.** A live agent answers a market question, and every claim it makes traces to Kernel rows it
actually read. Golden run step 4.

**Deliverables.** A worker queries the market plane — `venue`, `instrument`, `quote`, `market_event` —
through generated read tools, then publishes an artifact that **cites the object ids it read**, with
a lineage link from the artifact back to those rows.

**Acceptance.** The gate seeds known market rows, asks the question, and asserts every cited id
exists and matches a seeded row. Because the model is non-deterministic, **assert lineage validity,
never exact text.** An answer citing an id that was never read fails. An answer citing nothing fails.

**Falsify.** Have the agent answer from its own memory without calling a read tool — lineage is empty,
gate red. Cite a fabricated id — red.

**Out of scope.** Whether the answer is *good trading judgment*. That is Act II's evaluation plane,
and pretending a gate can judge it is how the last four plans died.

**Founder review — queued, does not block.** Read one real answer and its lineage.

### R7 — nothing approves on your behalf

**Proves.** No path approves a permission for the founder, and the inherited unconfined file surface
is closed.

**Deliverables.** `collab-electron/src/main/acp-agent.ts` still exposes `readTextFile` and
`writeTextFile` with no path confinement while advertising both capabilities to the client
(`docs/DEBT.md` #14). Either confine both to a declared root, exactly as `publish_artifact` was
confined in WO-106b, or retire the legacy path and delete its gate exception with it.

**Acceptance.** A permission request arriving with no human present is **denied**, not auto-allowed —
`4b7545a` fixed this, so falsify the fix rather than trusting it. A read or write outside the
declared root is refused. Confinement uses `relative()` plus `realpathSync.native` on both sides,
never a bare `startsWith` — the prefix-sibling case (`/tmp/root-evil` against root `/tmp/root`)
defeats that, and WO-106b already learned it.

**Falsify.** Six escape shapes on disk, mirroring WO-106b: absolute path outside root, `..`
traversal, symlink out, prefix sibling, UNC path, and root absent entirely. With the root unset the
surface must be **neither advertised nor callable** — absence never means unconstrained.

**Out of scope.** Rewriting agent-chat onto the species seam.

### R8 — the founder types the question

**Proves.** A research question typed into the canvas starts the run. Golden run step 0 — the last
plank, deliberately, because there is nothing to start until R3–R6 exist.

**Deliverables.** A canvas input that creates the initiating Kernel object and starts the
orchestrator against it. The question text lives in the Kernel from the moment it is submitted.

**Acceptance.** Submitting text creates the object, starts a session, and both survive close and
reopen. Assert by querying the Kernel, not the DOM.

**Falsify.** Hold the question in component state before writing it — Law A says a tile that
remembers is a bug, and `no-canvas-domain-writes` goes red.

**Out of scope.** Natural-language parsing of the question. Prompt engineering the orchestrator.

**Founder review — queued, does not block.** This is the golden run. Watch it once, end to end.

---

## Act I sign-off

Rungs close on gates. **Act I** closes on the founder.

When R8's gates are green, every queued `FOUNDER-REVIEW.md` gets read in one sitting, and the founder
watches the golden run happen once. Only then is Act I complete. A builder never marks that; it is
the one judgment no test can stand in for, and it is the entire reason the golden run was defined as
something observable rather than something asserted.

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
