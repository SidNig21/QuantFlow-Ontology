# WO-106 — VERIFICATION RECORD

**Verdict: PASS on D0–D5.** Verified + merged 2026-07-26, **zero rework rounds**.
Verified commit: `4d5f7af` on `wo-106`. Checking seat = architect; builder = Cursor.
D6 removed from this rung and split to `WO-106b` — see the bottom of this record.

## Method

Every claim re-measured by the checking seat. **No builder transcript used as evidence.** Cold suite
ran in a detached worktree at `4d5f7af` with **zero `node_modules`**, unpiped, exit on its own line,
**with no other agent running on the machine** (the builder recorded that a concurrent Cursor run
makes `runtime-proof` fail on foreign sockets — a third standing trap, now confirmed avoidable).

```
GATE_RUNNER_EXIT=0     19 PASS   0 FAIL
```

15 gates → **19**. Kernel suite 28 → 30.

## What this rung actually delivers

**The write catalogue stopped lying about itself.** Measured with the checking seat's **own MCP
client**, not the gate's helper:

| | Before (WO-105) | After |
|---|---|---|
| Action tools advertising **zero** properties | **24 of 24** | **0 of 24** |
| `qf_start_run` | name only | `properties: ["run_id"]`, `required: ["run_id"]` |
| `qf_publish_artifact` | name only | `["kind","content_hash","storage_ref","path"]` |
| Served total | 93 (69 read + 24 action) | 93 — unchanged |
| `qf_observe_ticket` served | no | **still no** |

`golden/tools.json` holds at **94** with `qf_observe_ticket` still generated-but-unserved, and
regenerates with no further diff — determinism, per G6 as written.

**Ruling 1 held.** The action transport is still `z.object({}).passthrough()`, so MCP did **not**
become a second validator. The two env levers the builder found and removed would have broken this;
only `QF_READ_SCHEMA_MODULE` and `QF_KERNEL_DB` remain, both legitimate.

**The hand-written read verbs are gone.** No declaration of `listArtifacts`, `listAgentSessions`,
`listAgentDefinitions`, or `getAgentDefinition` survives in `packages/qf-kernel/src` or
`collab-electron/src`. The renderer's **IPC method name** `window.api.qf.listArtifacts` correctly
survives untouched — the order's earlier draft would have banned it and reddened forever.

## Falsification — the part that matters

**G5, re-baited by the checking seat by editing real application code**, not a fixture:

| Step | Result |
|---|---|
| Baseline, gate alone | `PASS` |
| `kernel.ts` boot read `limit: null` → `limit: 100` | **`FAIL`, exit 1** |
| Failure message | `boot-reconcile FAIL: kernel.ts kernelListAgentSessions must pass limit null for agent_session` |
| Restore | `PASS`, tree clean |

**This is the rung's most important result, and it is a finding against the architect.** Ruling 3
predicted this failure in advance — *"every gate would stay green"* — and the gate written to catch
it **modelled** the boot path instead of watching it. The builder proved the gate vacuous by making
the real edit and watching all 19 gates pass, then rewired it to read the production callsite. The
failure now names the file and function.

Three of the five defects the builder sent back were the same shape: **a check whose two sides come
from one source.** That is the WO-004 forged-assertion class, three times on one rung.

## D5 — completed during verification

The builder could not run D5 (no model available, and it correctly declined to handle credentials).
The checking seat has Hermes configured, so it was run: same model, same framework, **no tool named
in the prompt**, against the branch.

| | Before | After |
|---|---|---|
| Attempts to create one run | **4** | **1** |
| Circuit-breaker penalty | ~60s | none |
| `params` | **dropped** — inexpressible | `{"note":"after-fix test"}` **preserved** |

Verified from the database, not the model's report: two events for two operations, no rejected
calls, nested `params` intact. Full record: `d5-after-real-model-2026-07-26.md`; baseline:
`d5-baseline-real-model-2026-07-26.md`.

## Deviation from the order, judged and accepted

**D3 said "delete the five wrappers" in `collab-electron/src/main/kernel.ts`. They survive**, rewired
to the generated readers — e.g. `queryObjects(getKernelDb(), "agent_session", undefined, null)`.

**Accepted, and arguably better than what the order asked for.** The purpose of D3 was to remove the
*second implementation of reading*, and the hand-written SQL is gone. The surviving wrappers encode
per-callsite intent (unbounded, `created_at ASC`) in one place instead of repeating `null` at every
consumer. Deleting them would have pushed those parameters outward and made the boot-path bug easier
to reintroduce, not harder. G4 correctly asserts *declarations*, which is the property that matters.
Recorded because it is a deviation, not because it is wrong.

## Recorded honestly — known limits

- **D6 not built** — split to `WO-106b`, below.
- ROADMAP debt #26 (GATE 1's strictness is top-level only) is untouched by this rung and remains
  trigger-gated.
- The `tool-discovery` gate proves the surface is **sufficient** for discovery. It does not prove a
  model discovers anything; Ruling 2 is explicit that only the D5 demo speaks to that, and the demo
  gates nothing.

## D6 — removed from this rung, and this is a finding against the architect

D6 was added **after** this order's adversarial read, in response to the WO-105 post-merge review.
It was therefore **the one deliverable nobody reviewed**, and it was wrong in three ways. The
builder-preparer seat stopped before writing any D6 code and raised
`BLOCKER-d6-staging-root.md`. All three findings re-measured by the checking seat; **all three
correct**:

1. **D6's stated reason was factually false.** It said `bytes` must keep working because "the
   Electron app publishes through it." Measured: **every** `publish_artifact` call in
   `collab-electron/src` passes `path`. The only `bytes` producers are `tools/qf-peer-bus` and the
   Kernel's own tests. The schema's own field description says why: *"MCP callers must supply this
   because bytes cannot cross JSON."*
2. **"A declared staging root" had no spelling**, and the `path` callers stage into different
   directories.
3. **D6 demanded a Kernel-wide rejection "so it applies to every caller"** — which would have broken
   the founder's own file-picker publish (`renderer.js:962`, a native `openFileDialog` where a human
   chooses an arbitrary file by hand).

**The lesson is the order's, not the builder's:** a deliverable added after the read is a deliverable
with no read. The process caught it only because the builder stopped rather than improvised. That is
the second time in two rungs that stopping was the correct move.

The vulnerability (debt #25) is unchanged and real. `WO-106b` carries the corrected ruling — the
constraint belongs at the **MCP serving boundary**, where the untrusted caller enters, not in the
Kernel where it would hit the app and the founder too.

## Process scoreboard

Pre-build read (3 questions, including *does the order contradict itself?*) caught **13 findings, 7
High**, three of them self-contradictions. Build produced **zero rework rounds** — the first rung of
this size to do so. The builder sent back **five defects in its own new gates**, three of them the
one-source-two-sides shape, and **falsified every gate by editing shipping code rather than flipping
a switch.**

Running tally: WO-103 no read → 2 rework rounds. WO-103b read → 0. WO-104 read → 1. WO-105 read
(2 questions) → 1, plus two blockers the read structurally could not catch. **WO-106 read (3
questions) → 0 rework rounds, with the only blocker being a deliverable added after the read.**
