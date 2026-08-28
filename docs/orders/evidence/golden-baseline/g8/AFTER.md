# G8 builder receipt — candidate and evidence

Plain language: the research console now keeps its temporary proof data isolated, sends governed updates through one trusted route, and refuses incomplete result handoffs.

## Authority and immutable commits

| item | value |
| --- | --- |
| order | `docs/orders/WO-GOLDEN-G8.md` |
| starting parent | `c7cc7f4ad69c4e0c484ee5b71ed2e543837506e5` / tree `11899c691f3af253d88f0f4e4ff6b5db916f0663` |
| starting branch | `wo-golden-g2` |
| semantic Reader | task `01a04716-ef0f-72d1-aaa1-be295596f893`; authority `baedcecd55b91dc3c5d951f969a2111d5cedf4d2`; tree `33695d1ac5a53b56077bbf739d94e6e230d6533b`; YES / YES |
| product candidate | `b20966dc8ec86193de8af092df45248fbeb3fc1b` / tree `3023dc2091b8b3c44da564266b0d24126da2247c` |
| evidence commit | separate evidence-only commit; SHA/tree reported with the final handoff |
| publication | not pushed; no branch switch or worktree/copy created |

The candidate commit contains only the ordered product, test, gate, schema-generated, and atlas-generated files. `BEFORE.md`, `CANDIDATE-LEDGER.tsv`, `COMMANDS.tsv`, `FALSIFIERS.tsv`, and this receipt are reserved for the separate evidence-only commit.

## Product changes

The candidate makes the following bounded repairs:

- Neutralized only the 13 disposable K1 names; the `QF_KERNEL_DB` boundary and all live assertions remain intact.
- Added the governed source-work and critic-tool-receipt operations to the typed Kernel action and routed public adapters through `execute()`.
- Joined generated internal commands to derived task/app handler maps and exported the completeness surface used by the proof.
- Preserved the independent Evaluation→Report publication path; no G9 semantic consolidation was performed.
- Bound Main support writes and delegation creation to Kernel action/ontology paths; no direct `qf_review` or Main `links` write remains.
- Added isolated live packaged result-observation and worker-completion-substitution falsifiers, exact Director PTY/role/session identity checks, malformed activation restoration receipts, and cleanup enforcement.
- Added executable exact-89 lifecycle identity/experimental checks and the `market.competitor experimental → active` promotion bait; regenerated only the affected ontology golden output.
- Repaired the historical upgrade snapshot expectation so the existing package suite covers the current predecessor schema without changing migration truth.
- Regenerated and ratcheted `qf-atlas/` after the final source changes.

Changed product files are the 30 files in the product commit (`git show --stat b20966dc8ec86193de8af092df45248fbeb3fc1b`):

```text
collab-electron/src/main/kernel.ts
collab-electron/src/main/sidecar/server.ts
packages/qf-kernel/src/execute.ts
packages/qf-kernel/src/governed-review.ts
packages/qf-kernel/src/index.ts
packages/qf-kernel/src/portable.ts
packages/qf-kernel/src/r11a-deterministic-execution.test.ts
packages/qf-kernel/src/upgrade.ts
qa/gates/dev-dock-readiness.ts
qa/gates/founder-steering.ts
qa/gates/golden-g8-kernel-proof.ts
qa/gates/golden-g8-schema-lifecycle.ts
qa/gates/hermes-research.ts
qa/gates/kernel-one-path.ts
qa/gates/kernel-sole-writer-app.ts
qa/gates/pre-r18-coherence.ts
qa/gates/r17-founder-kernel-compatibility.ts
qa/gates/r17-guided-technique-consumer.ts
qa/gates/research-director-delegation.ts
qa/gates/research-director-front-door.ts
qa/gates/research-world-visible.ts
qa/gates/team-composition-ui.ts
qa/gates/team-composition.ts
qa/gates/technique-outcome-loop.ts
qa/run.ts
qf-atlas/ATLAS.md
qf-atlas/atlas.html
qf-atlas/atlas.json
qf-kernel-schema/golden/ONTOLOGY.md
qf-kernel-schema/src/ontology/agent.ts
```

## Command evidence

The complete freeze, changed-surface, candidate, and cleanup command ledger is in `COMMANDS.tsv`. The final candidate-bound packaged command was:

```text
bun qa/run.ts hermes-first-turn-synthetic
exit=0
package identity: b20966dc8ec86193de8af092df45248fbeb3fc1b
final: hermes-first-turn-synthetic: PASS
final cleanup: roots_created=26 roots_remaining=0 preexisting=5 leaked=[]
final process cleanup: remainingGateOwnedProcesses=0
```

Changed-surface evidence includes `107 pass / 0 fail / 415 expect` for qf-kernel, `21 pass / 0 fail / 148 expect` for focused collab tests, `179 pass / 0 fail / 615 expect` for qf-kernel-schema, a successful native Windows Electron build, exact schema total `89` (`23` objects, `23` links, `43` actions), zero K1 offenders, Law-B bypass red/green, and atlas HARD RED `0` / unexplained coverage `0`.

## Falsifier receipts

The finite red→green receipts are in `FALSIFIERS.tsv`.

- All 13 exact K1 paths produce `caught=true`, `result.ok=false`, `red_exit=1`, exact bait removal, `bait_path_exists_after=false`, `process_delta=0`, and `root_delta=0`; each restored run returns `normal_rerun_exit=0`.
- Missing and undeclared internal-handler baits fail with the named action/key while declaration/action sets stay unchanged, then restore green.
- The Law-B direct Main-link bypass bait fails, while the restored `execute(governed_review_task)` authority passes; current static proof reports support tables `6`, Kernel doors `14`, named Main wrappers `11`, and bypasses `0`.
- The lifecycle proof reports exact total `89`, unique identities, all `experimental`, and exact source-set equality; golden byte drift and `market.competitor experimental → active` promotion both fail and restore green.
- The candidate-bound normal ordered receipt was `director_pty_id=44903dddd016eba5`, `to_role=orchestrator`, `to_session_id=5436f6c1-df19-426b-aeb9-78dd0246f3cc`, `from_role=worker`, `from_session_id=synthetic-worker-cd019c6f-692b-43a2-a03c-35bda1ce21ac`, `message_id=4a50c735-7b15-4e88-83c9-042e14aae786`, `task_id=task-234ff11b-e289-45a3-a4e3-14e04323abda`, `artifact_id=1db915971d193e477485746524d84f7a56cea6e57b577c8849b377e5d4c14296`, with transcript indices `4826 < 5378`.
- `missing-result-observation` and `worker-complete-is-result` each fail in the live packaged path with the Director notification suppressed, worker completion observed, `result_return_observed=false`, `caught=true`, `result_ok=false`, and `red_exit=1`; each fresh restored run has an exact Director receipt before `result_return` and `normal_rerun_exit=0`.
- `missing-review-task-id`, `mismatched-source-work`, and `substituted-result-artifact-id` each fail as exact malformed activation refusals with no evaluation write; each fresh restored run produces an exact post-restore exit-0 receipt and the expected evidence boundary.
- All ten named package boundaries produce their direct red mechanism and restored `failed_boundary=null`, `failure_mechanism=none`, exit-0 receipt. Cleanup baits cover retained PIDs, malformed cleanup receipts, all five retry codes, static remove/create routing, retained roots, and half-born-seat ownership.

## Inherited reds and scope boundaries

- The starting native Electron/Vite build red was the same Windows access-denied environment failure in the packaged gate and direct build. A native Windows build later completed green; the remaining G12 installer/Windows-operation qualification is explicitly inherited and outside G8.
- The legacy `qf.research.run_kernel_falsifiers` report-boundary call still reports `unknown agent_definition_id: hermes-orchestrator`. It is recorded as an inherited G9 red. The current G8 normal run proves report/result identity and all ten G8 boundaries green; `index.ts` was not changed and no G9 consolidation was performed.
- G10 Canvas/Mission, G11 history/docs, G12 installer/operations, and R18 remain closed or frozen as ordered.

## Saved state and cleanup

No canonical founder/user database or credential state was opened, changed, hashed, logged, or copied. All live checks used isolated temporary roots. The finite saved-state seams were read back only in those isolated fixtures: session identity/status, task identity/status, hypothesis identity, run identity/status and executor session, artifact identity/kind, link identity/kind/endpoints, peer-message identity/roles/sessions/kind/artifact, and Director PTY identity.

The final candidate-bound gate reports `roots_remaining=0`, `leaked=[]`, and `remainingGateOwnedProcesses=0`. Host inspection after completion found no owned `qf-hermes-*` or `qf-retry-*` roots and no live `QuantFlow`/`bun` processes. Five dated `qf-boundary-*` roots were pre-existing and were preserved, matching the gate's `preexisting=5` receipt.

## Judgment exercised

Where the order was silent, I kept the worker result artifact typed as the existing `trajectory` kind and the fixture cutoff at the existing R17 authority date, retained the durable metrics assertion instead of a PTY-text assertion, and added the durable lineage-publication receipt before the restored all-boundaries readback. I also caught only the exact retired G9 agent-profile error in the legacy report-boundary helper so current G8 result/report identity remains exercised without taking ownership of G9 semantics.

This is a Builder evidence handoff, not group acceptance. The independent Verifier must rerun the matrix against the immutable candidate and decide whether G8 landed.
