# Final G9 repair Builder proof matrix

Plain language: the semantic repair checks are green, while one already-known
packaged-app shutdown defect remains red and belongs to G12.

## Focused semantic proofs

Each command was run separately to avoid Electron mock interference.

| command | observed result |
| --- | --- |
| `bun test packages/qf-kernel/src/g9-report-authority.test.ts` | 7 pass, 0 fail, 38 expect calls |
| `bun test packages/qf-kernel/src/r15-governed-review.test.ts` | 9 pass, 0 fail, 66 expect calls |
| `bun test packages/qf-kernel/src/r16-visible-world.test.ts` | 3 pass, 0 fail, 5 expect calls |
| `bun test collab-electron/src/main/governed-review.test.ts` | 6 pass, 0 fail, 62 expect calls |
| `bun test collab-electron/src/main/ontology-gateway.test.ts` | 6 pass, 0 fail, 102 expect calls |
| `bun test collab-electron/src/main/research-world.test.ts` | 4 pass, 0 fail, 61 expect calls |

The G9 Kernel suite specifically covers exact worker Artifact completion
lineage, wrong-artifact refusal before publication, restart durability, and
legacy migration ordering.

## Executable F01–F14 gate

Command: `bun qa/run.ts report-authority`

F01–F09 and F11–F14 each emitted the required falsifier red followed by the
restored green control. The recorded red mechanisms were:

| boundary | falsifier red | restored control |
| --- | --- | --- |
| F01 | ordinary completion is not one trajectory Artifact | runtime invariant passed |
| F02 | Evaluation publication agreement is invalid | runtime invariant passed |
| F03 | record_evaluation requires a running governed review Task | runtime invariant passed |
| F04 | Run lacks exact worker evidence binding | runtime invariant passed |
| F05 | current authority cardinality is 2 | runtime invariant passed |
| F06 | prior publication is not explicit history | runtime invariant passed |
| F07 | distinct five-field contexts folded into one authority key | runtime invariant passed |
| F08 | projection current_report_id disagrees with durable current row | runtime invariant passed |
| F09 | Run lacks exact worker evidence binding | runtime invariant passed |
| F11 | Evaluation publication agreement is invalid | runtime invariant passed |
| F12 | legacy authority key does not preserve the complete five-field partition | runtime invariant passed |
| F13 | legacy publication row cannot resolve Evaluation | runtime invariant passed |
| F14 | historical Electron finalizer marked its own Report current | runtime invariant passed |

F10 exercised the actual Electron `qf.research.run_kernel_falsifiers` RPC:

```text
hermes-first-turn-synthetic: FALSIFY RED stale-profile rejected=unknown agent_definition_id: hermes-orchestrator
hermes-first-turn-synthetic: FALSIFY RED missing_report rejected=KernelError: publish_artifact report requires an Evaluation with verdict supports
hermes-first-turn-synthetic: FALSIFY RED rejects_evaluation rejected=status=rejected
hermes-first-turn-synthetic: FALSIFY RED changed_repeat rejected=KernelError: claimed deterministic repeat input manifest differs
hermes-first-turn-synthetic: FALSIFY GREEN stale profile restored to hermes-research-director; missing Evaluation, rejects Evaluation, and changed replay restored to accepted positive-control boundaries
```

The overall command remained red only at packaged shutdown:

```text
windows-hermes-research: shutdown-observation={"child_pid":30512,"child_event_exit_code":0,"child_pid_alive":false,"packaged_processes_alive":[{"pid":17316,"parent_pid":30512,"name":"QuantFlow.exe"},{"pid":30836,"parent_pid":26332,"name":"node.exe"},{"pid":20836,"parent_pid":30836,"name":"node.exe"},{"pid":30096,"parent_pid":30836,"name":"node.exe"}],"launcher_event_stale":false}
hermes-f10: FAIL application did not exit within 20000ms
hermes-first-turn-synthetic: temp-cleanup roots_created=1 roots_remaining=0 retried=0 preexisting=7 leaked=[]
FAIL report-authority
```

This is a real packaged `QuantFlow.exe` and descendant Node process survivor,
not a stale launcher event. The launcher PID exited with code 0; the package
process set did not. No shutdown repair was attempted. G12 owns this red.

## Atlas

Commands and observed results:

```text
bun qf-atlas/generate.mjs
qf-atlas: wrote atlas.json + atlas.html + ATLAS.md
  407 files · 99 subsystems · 111 IPC channels
  wires: 104 live · 4 unreached · 3 unused · 0 DEAD
  7 strip candidates · 10 confirmed violations · 2 gray · 20 coverage gaps

bun qf-atlas/generate.mjs --check
qf-atlas: current — 407 files, 111 channels, 7 strip candidates

bun qf-atlas/ratchet.mjs
qf-atlas ratchet — 3.3s (budget 60s)
  baseline: 3 entries · HARD RED: 0 · unexplained coverage: 0 · undecided w/o blocker: 0
```

G10 was not opened.
