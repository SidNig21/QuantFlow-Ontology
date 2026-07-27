# D5 — the after-picture: the same real model, against the fixed plane

**Run by:** the checking seat during verification of `4d5f7af`, founder present.
**The builder could not run D5** (no model available, and it correctly declined to handle
credentials). The checking seat has Hermes configured, so D5 was completed during verification.

Same model, same framework, same prompt shape, **no tool named** — the only difference is that this
run went against the WO-106 branch instead of `main`.

## The comparison

Baseline is `d5-baseline-real-model-2026-07-26.md`, taken before the fix.

| | Before (WO-105 plane) | After (WO-106 plane) |
|---|---|---|
| Attempts to create one run | **4** | **1** |
| Circuit-breaker penalty | ~60s, after 3 consecutive rejections | none |
| Errors returned | 3 | **0** |
| `params` | **dropped** — model could not express it | `{"note":"after-fix test"}` **preserved** |
| How the model learned the shape | reverse-engineered from GATE 1's rejection messages | read it from `tools/list` |

The model's own words in the baseline run were: *"there is no way to send a record through this tool
interface, so the run was created with default empty params."* In this run it simply sent the field.

## Verified independently, not from the model's report

```
runs: {"id":"run-after-fix-test-20260726-001","status":"running",
       "params":"{\"note\":\"after-fix test\"}"}
events: 2 ["run.created","run.started"]
```

Two events for two operations — no rejected calls, and the nested `params` object landed intact.

## What this proves and does not prove

**Proves:** the advertisement fix works end-to-end against a real model over real MCP, and it
recovers data that was previously lost. The baseline's dropped field is the concrete cost debt #24
was logged for; it is now paid back.

**Does not prove:** anything repeatable. This is one run of a non-deterministic system, which is
exactly why Ruling 2 keeps it out of the gate set. The deterministic half of the claim is the
`tool-discovery` gate, which is in the suite and passes cold.

**Also measured independently by the checking seat, with its own MCP client rather than the gate's
helper:** 93 tools served, 69 read + 24 action, **0 action tools advertising zero properties**
(was 24 of 24), `qf_start_run` advertising `required: ["run_id"]`, and `qf_observe_ticket` still
absent from the served catalogue.
