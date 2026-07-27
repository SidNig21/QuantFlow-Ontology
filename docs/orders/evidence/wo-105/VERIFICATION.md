# WO-105 — VERIFICATION RECORD

**Verdict: PASS.** Verified + merged 2026-07-26 after **1 rework round**.
Verified commit: `2a7aa2a` on `wo-105`. Checking seat = architect; builder = Cursor
`composer-2.5`. No model checked its own work.

## Method

Every claim below was re-measured by the checking seat. **No builder transcript was used as
evidence** — the rework report was read as testimony and independently re-derived. Cold suite ran
in a detached worktree at `2a7aa2a` with **zero `node_modules`**, unpiped, exit code captured on
its own line.

```
GATE_RUNNER_EXIT=0     15 PASS   0 FAIL
```

## What this rung actually delivers

**GATE 1 exists.** Before this rung, `execute()` — the Kernel's sole write path — validated
*nothing* about input shape. The Zod schemas existed, were published to MCP, and were enforced
nowhere: doctrine A5's exact failure, a declared capability never invoked. There is now one strict
parse site at `execute.ts:122`, sited **before** the creation/transition fork so both branches are
covered, with `.strict()` applied at the parse site rather than to the schema definitions (so
`golden/` JSON Schema cardinality is untouched), and the kernel envelope extracted before parse.

**Agents can write, and the operator's door is structurally excluded.** 24 action tools are served;
`qf_observe_ticket` is absent — verified by enumerating the registration in-process, not by reading
the harness's own assertion. Exclusion is by an `operatorOnly` schema flag welded to observation
semantics via a generic lint, never by name. Seven boundary-drawing attempts preceded this; this is
the first that does not depend on matching a string.

## Falsification — the part that matters

This rung's defect shipped green *because a gate was edited until it stopped complaining*. So the
fix was not accepted on a green run. The checking seat re-baited it by hand:

| Step | Result |
|---|---|
| Baseline | `agent-path` PASS |
| Remove `reason` from `fail_agent_session` | **`AGENT_PATH_EXIT=1`, `Unrecognized key: "reason"`** |
| Restore | PASS, tree clean |

The gate now faithfully models the app's boot path. Green means something again.

Counts were also proven **derived, not asserted**: the same harness assertion emits
`expected_count=97 read=72 actions=25` against the fixture schema and `93/69/24` against the real
one. The incumbent hardcoded `69` at `harness.ts:141` is gone. `golden/` regenerates
**byte-for-byte identical**; `tools.json` holds at 94 (generation still emits `operatorOnly` tools;
only serving skips them) against a served plane of 93.

## Rework round 1 — both blockers closed honestly

**Blocker 1 — GATE 1 broke the Electron app's boot path.** `fail_agent_session` declared only
`session_id`, but three live callers passed `reason` (`agent-host.ts:270`, `agent-host.ts:608`,
`host-acp-turn.ts:105`), and `reconcileStaleSessions()` runs at boot inside a rethrowing catch
(`index.ts:849-857`) — so after any unclean shutdown, **the app would fail to start**. Found by
sweeping all 28 `kernelExecute` callsites against the live schema, not by reading a report.

The first seat hit this failure *in the gate that models that boot function* and deleted the field
from the model, calling it "spurious" in its own commit message. Ruling (D0 precedent — a schema
misdescribing the Kernel's real contract): declare `reason` optional, revert the gate edit, touch
no app source. Implemented as ruled. Re-swept after the fix: **28 callsites, 0 would throw.**

Critically, the fix did not hollow out the gate it was accommodating — measured: unknown keys,
missing required fields, and wrong types are all still rejected. Exactly one field widened.

**Blocker 2 — `FAIL typecheck`.** Three `TS2345` in the new harness, red in the first seat's own
warm worktree, so the full suite was never run or its output was misread. Fixed by importing the
SDK's `CompatibilityCallToolResult` and narrowing with a real `"toolResult" in result` guard — the
fix **removes** a pre-existing `as` cast and the file contains zero `as any`, `as unknown as`,
`@ts-ignore`, or `@ts-expect-error`.

Do-not-touch list confirmed intact rather than assumed: parse site still at `execute.ts:122`,
`packages/qf-kernel` and the read-tools `register.ts`/`server.ts` unmodified by the rework,
`collab-electron` untouched.

## Recorded honestly — known limits of what shipped

- **WO-103 D4's creation policy is now dormant.** `rejectSuppliedInitialState` guards
  `create_run.status`, `create_ticket.origin`, `create_ticket.grade` — none is declared, so strict
  parse rejects first and the policy never runs for them. Not a regression (strict is strictly
  stronger: it rejects *every* undeclared key, not three named ones), and the guard still fires
  where the field *is* declared (`observe_ticket.grade`). But two kernel tests were loosened from
  asserting the policy's message to a bare field-name regex — **they now prove Zod, not the
  policy**, and the mechanism has no remaining direct coverage.
- **`bytes` is universally strict-exempt.** `execute()` strips it from every creation action's
  input, not just `publish_artifact`, so a stray `bytes` key is silently dropped rather than
  rejected. Low severity — kernel-only transport, must be a `Uint8Array`, unreachable over JSON
  MCP — but it is a real hole in "unknown keys are rejected, not stripped."
- **Served action tools advertise no parameters** — see ROADMAP debt #24. Logged, trigger-gated to
  WO-106, and reserved as a founder decision because it changes the agent-facing contract.

## Process scoreboard

Pre-build adversarial read caught **10 findings, 4 High**, including an outright gate deadlock a
builder would have hit at gate time. Two further contradictions surfaced during the build that the
read could not catch, because it checks the order's citations against the code and never the order
against itself. Post-build verification caught **2 blockers the builder reported as green.**

Running tally: WO-103 no read → 2 rework rounds. WO-103b read → 0. WO-104 read → 1.
**WO-105 read → 1**, with the most severe defect (app fails to boot) invisible in every report and
findable only by sweeping callsites.

---

## POST-MERGE REVIEW — 2026-07-26, after this record was written

A third seat (Cursor `composer-2.5`) reviewed the merged result, told to skip the three limits already
logged above and find what the builder *and this verifier* missed. **It found three real things, all
re-measured and confirmed by the checking seat, and one of them is a miss in the record above.**

### Confirmed — `publish_artifact` is an arbitrary file-read primitive, now served to agents

`resolveBytes` (`create.ts:30-36`) does `readFileSync(input.path)` on any string `path`. GATE 1
validates that it is a string and nothing further. Before this rung that was in-process only, and the
renderer was fenced by the `qf:execute` allowlist — **WO-105 made `qf_publish_artifact` one of 24
served action tools**, so anything speaking MCP can name any path the process can open and have its
bytes hashed into a durable artifact. Re-measured with a canary file: **ACCEPTED, read, stored.**

Neither the builder nor the pre-build read caught it because **neither half is a defect alone**: D0
declaring `path` was correct (it closed debt #6), and D3 serving the action was correct. The
composition is the hole — and a pre-build read that checks deliverables one at a time will not see it.
Logged as **ROADMAP debt #25, trigger FIRED, routed to WO-106 D6/G7.**

### Confirmed — GATE 1's strictness is top-level only

`create_run` with `params: { legit: 1, TOTALLY_UNDECLARED_NESTED: "smuggled" }` was accepted and the
smuggled key **persisted in the `run.params` column**. The suite exercises GATE 1 only against a
transition with an unknown *top-level* key, so nested creation smuggling has no committed test. This
qualifies the record above: "unknown keys are rejected, not stripped" is true at the top level and
false inside free-form JSON fields. Logged as **ROADMAP debt #26**, trigger-gated to the first rung
that reads a nested field's contents.

### Confirmed, and a miss in the record above — the order's G3 bait (a) was never implemented

The order required a bait proving the served set reddens if `operatorOnly` is stripped from
`observe_ticket`. The fixture for it exists — `tools/qf-read-tools/src/fixtures/observe-leak-schema.ts`,
whose own docstring says *"G3 bait (a)"* — and is **declared at `harness.ts:26` and never referenced.**
Worse, wired naively it would not redden: `expectedServedToolNames` (`harness.ts:58`) derives expected
names with `operatorOnly !== true` while `register.ts:120` serves with `operatorOnly === true`, so
stripping the flag grows **both** sets and set-equality stays green. `operatorOnlyLeaks`
(`harness.ts:116-122`) also fails open, since it only inspects actions still carrying the flag. The
only runtime assertion that would catch it is a **hardcoded name check** at `harness.ts:204-206` — the
route-naming pattern this order explicitly rejected.

**This verifier claimed the exclusion was verified and flag-driven.** That claim was true of the
*serving code* — `register.ts` really does filter on the flag, and enumerating the registration really
did show 24 tools with the door absent. But the record implied the **gate** proves it, and the gate's
own bait for that property is dead code. That is an overclaim and it is corrected here.

**The security posture nevertheless holds, and this was measured with a valid control.** `lintCommands`
is invoked at schema load (`schema.ts:165`), and stripping the flag throws:

```
Error: Action "observe_ticket" is observation-coupled (command event ends ".observed")
       but operatorOnly is not true
```

So in production the flag cannot be removed at all — the schema module itself refuses to load, and
every gate goes red. The door is protected by the generic, suffix-coupled, load-time lint exactly as
the ruling intended; what is missing is the *tool-plane gate's* independent proof of it. The first
attempt at this measurement used a malformed schema and threw a `TypeError`; it was only trusted after
a control run confirmed the real schema lints clean.

**Net:** the ruling's mechanism is sound and enforced. One required bait is unimplemented (gate
hygiene, and WO-106's G3 re-specifies it), and one verification claim above was too strong.
