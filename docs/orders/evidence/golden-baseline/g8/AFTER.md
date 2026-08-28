# G8 final receipt — candidate, evidence, and independent verification

status: **CLOSED — PASS WITH INHERITED G9/G12 REDS**

Plain language: the research console now keeps its temporary proof data isolated, sends governed updates through one trusted route, and refuses incomplete result handoffs.

## Authority and immutable commits

| item | value |
| --- | --- |
| order | `docs/orders/WO-GOLDEN-G8.md` |
| starting parent | `a41afa6def64ea2d353173ab6b49f22360f51a55` / tree `493c8062200c8ea52fdb8bd6e2010d84bea3cf1e` |
| starting branch | `wo-golden-g2` |
| amendment Reader | task `01a047ea-2e77-79e3-9052-47982b265786`; authority `1d121ef3ebf9af4014632417d98984d468e93cdb`; tree `ed66a06c9ade1a97559f06cd18e236497b77239c`; YES / YES |
| product candidate | `6a26340162148118c84f0148638bd36a32a3af99` / tree `1b242d47035745f356eb0f3ff2ec9beda584eb7c` |
| evidence commit | separate evidence-only commit; SHA/tree reported with the final handoff |
| publication | not pushed; no branch switch or worktree/copy created |

## Final independent verification identity

| item | value |
| --- | --- |
| verifier task | `01a0487e-4331-76e1-86ed-ef1b8db29e94` |
| verifier verdict | **PASS WITH INHERITED G9/G12 REDS** |
| final product candidate | `61abfa5b23553f86a5c2d95facdf0473310fc44` / tree `94ef17e1876c68fcfb2713f4a2cf9f0d05a9d013` |
| final evidence head | `754606932dfb23bd0a6e6f432937b1c2bc436739` / tree `b04a991ca98da1d57b8637a7fcd0738a4e41bd21` |
| candidate/evidence relation | receipt-only evidence; product candidate unchanged |

The amendment candidate contains only the two repaired QA gates and the three atlas artifacts generated from them. The two Reader-admitted source paths are retained unchanged at their frozen SHA-256 values below. `BEFORE.md`, `CANDIDATE-LEDGER.tsv`, `COMMANDS.tsv`, `FALSIFIERS.tsv`, and this receipt are reserved for the separate evidence-only commit.

## Amendment delta — V-01 through V-04

The candidate repairs only the four admitted defects. V-01 binds the packaged identity to the configured immutable product candidate while reporting the evidence head separately. V-02 accepts only the documented ConPTY line-ending/CSI cursor-position frame and rejects visible task-token insertion, deletion, or substitution. V-03 retains exactly the two Reader-admitted pre-hashed paths. V-04 snapshots the actual gate-owned process/root sets, computes their symmetric deltas, and proves a live-root bait red before the restored zero-delta run.

### V-03 exact two-path amendment receipt

```text
candidate_parent=a41afa6def64ea2d353173ab6b49f22360f51a55
candidate=6a26340162148118c84f0148638bd36a32a3af99
changed_path_count=2
changed_path_equality=true
path=collab-electron/src/main/sidecar/server.ts pre_sha256=7AE53F139B847FBC5638322301BDDAEB8D4CBEA70BB765140BCD809697AF153C post_sha256=7AE53F139B847FBC5638322301BDDAEB8D4CBEA70BB765140BCD809697AF153C retained=true
path=packages/qf-kernel/src/upgrade.ts pre_sha256=C0D6047FEC75632E9FB59E82B278E7BF09D3A0F67610BB6F1CA4F398B764A660 post_sha256=C0D6047FEC75632E9FB59E82B278E7BF09D3A0F67610BB6F1CA4F398B764A660 retained=true
third_path=false
```

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

The amendment product delta is exactly these five files (`git show --stat 6a26340162148118c84f0148638bd36a32a3af99`):

```text
qa/gates/golden-g8-kernel-proof.ts
qa/gates/hermes-research.ts
qf-atlas/ATLAS.md
qf-atlas/atlas.html
qf-atlas/atlas.json
```

The earlier G8 product remains inherited from the starting authority; this amendment did not reopen or rewrite it.

## Command evidence

The complete freeze, changed-surface, candidate, and cleanup command ledger is in `COMMANDS.tsv`. The final candidate-bound packaged command was run with `QF_PRODUCT_CANDIDATE_SHA=6a26340162148118c84f0148638bd36a32a3af99` and reported:

```text
bun qa/run.ts hermes-first-turn-synthetic
exit=0
package identity: candidate_sha=6a26340162148118c84f0148638bd36a32a3af99; evidence_head_sha=<receipt-head-at-run>
final: hermes-first-turn-synthetic: PASS
final cleanup: roots_created=26 roots_remaining=0 preexisting=5 leaked=[]
final process cleanup: remainingGateOwnedProcesses=0
```

Changed-surface evidence includes `107 pass / 0 fail / 415 expect` for qf-kernel, `21 pass / 0 fail / 148 expect` for focused collab tests, `179 pass / 0 fail / 615 expect` for qf-kernel-schema, a successful native Windows Electron build, exact schema total `89` (`23` objects, `23` links, `43` actions), zero K1 offenders, Law-B bypass red/green, and atlas HARD RED `0` / unexplained coverage `0`.

## Falsifier receipts

The finite red→green receipts are in `FALSIFIERS.tsv`.

- V-01 produces `FALSIFY RED package-candidate-evidence-mismatch` with distinct candidate/evidence/embedded values and `red_exit=1`, then the exact candidate binding restores with `normal_rerun_exit=0`.
- V-02 produces separate `FALSIFY RED task-identity` receipts for `task--abc` and `taask-abc` against `task-abc`, then the documented transport wrapper restores with `normal_rerun_exit=0`.
- V-04 produces a live-root bait receipt with measured `root_delta=1`, then a restored snapshot with computed `process_delta=0` and `root_delta=0`; all 13 exact K1 paths still produce `caught=true`, `result.ok=false`, `red_exit=1`, exact bait removal, and restored `normal_rerun_exit=0`.
- Missing and undeclared internal-handler baits fail with the named action/key while declaration/action sets stay unchanged, then restore green.
- The Law-B direct Main-link bypass bait fails, while the restored `execute(governed_review_task)` authority passes; current static proof reports support tables `6`, Kernel doors `14`, named Main wrappers `11`, and bypasses `0`.
- The lifecycle proof reports exact total `89`, unique identities, all `experimental`, and exact source-set equality; golden byte drift and `market.competitor experimental → active` promotion both fail and restore green.
- The final candidate-bound normal ordered receipt, exact package identity, evidence-head SHA, and cleanup lines are printed by the final native command and are preserved in the handoff below; the immutable product candidate remains `6a26340162148118c84f0148638bd36a32a3af99`.
- `missing-result-observation` and `worker-complete-is-result` each fail in the live packaged path with the Director notification suppressed, worker completion observed, `result_return_observed=false`, `caught=true`, `result_ok=false`, and `red_exit=1`; each fresh restored run has an exact Director receipt before `result_return` and `normal_rerun_exit=0`.
- `missing-review-task-id`, `mismatched-source-work`, and `substituted-result-artifact-id` each fail as exact malformed activation refusals with no evaluation write; each fresh restored run produces an exact post-restore exit-0 receipt and the expected evidence boundary.
- All ten named package boundaries produce their direct red mechanism and restored `failed_boundary=null`, `failure_mechanism=none`, exit-0 receipt. Cleanup baits cover retained PIDs, malformed cleanup receipts, all five retry codes, static remove/create routing, retained roots, and half-born-seat ownership.

## Inherited reds and scope boundaries

- The starting native Electron/Vite build red was the same Windows access-denied environment failure in the packaged gate and direct build. A native Windows build later completed green; the remaining G12 installer/Windows-operation qualification is explicitly inherited and outside G8.
- The legacy `qf.research.run_kernel_falsifiers` report-boundary call still reports `unknown agent_definition_id: hermes-orchestrator`. It is recorded as an inherited G9 red. The current G8 normal run proves report/result identity and all ten G8 boundaries green; `index.ts` was not changed and no G9 consolidation was performed.
- G10 Canvas/Mission, G11 history/docs, G12 installer/operations, and R18 remain closed or frozen as ordered.

## Saved state and cleanup

No canonical founder/user database or credential state was opened, changed, hashed, logged, or copied. All live checks used isolated temporary roots. The finite saved-state seams were read back only in those isolated fixtures: session identity/status, task identity/status, hypothesis identity, run identity/status and executor session, artifact identity/kind, link identity/kind/endpoints, peer-message identity/roles/sessions/kind/artifact, and Director PTY identity.

The final candidate-bound gate reports `roots_remaining=0`, `leaked=[]`, and `remainingGateOwnedProcesses=0`. The V-04 proof also reports actual before/after PID and root arrays for the focused K1 runs. Host inspection after completion found no owned `qf-hermes-*` or `qf-retry-*` roots and no live `QuantFlow`/`bun` processes. Five dated `qf-boundary-*` roots were pre-existing and were preserved, matching the gate's `preexisting=5` receipt.

## Judgment exercised

Where the amendment was silent, I treated the explicit ConPTY cursor-position frame as transport framing only when its line-ending/CSI shape was present and the repeated boundary byte matched; raw malformed spellings never receive fuzzy repair. I retained the two Reader-admitted source files byte-for-byte, kept the existing result/report and cleanup assertions intact, and left the inherited G9 report-boundary error outside this repair.

This is a Builder evidence handoff, not group acceptance. The independent Verifier must rerun the matrix against the immutable candidate and decide whether G8 landed.

## Final independent Verifier closeout

The fresh independent Verifier task
`01a0487e-4331-76e1-86ed-ef1b8db29e94` bound its decision to product
candidate `61abfa5b23553f86a5c2d95facdf0473310fc44` (tree
`94ef17e1876c68fcfb2713f4a2cf9f0d05a9d013`) and evidence head
`754606932dfb23bd0a6e6f432937b1c2bc436739` (tree
`b04a991ca98da1d57b8637a7fcd0738a4e41bd21`). It returned
**PASS WITH INHERITED G9/G12 REDS**.

Its independent evidence included the deterministic old-selector red,
`30/30` repaired repetitions, qf-kernel `108/108`, governed-review `15/15`,
live policy `9/9`, all G8/schema/K1/Law-B/G7/Atlas gates green, Atlas
`HARD RED 0`, production byte-equivalence outside the authorized test repair,
the reused candidate-bound packaged receipt, and zero worktree/process/owned
root residue. The inherited G9 report-boundary red and G12
Windows/package/operations reds remain reds and are not G8 acceptance.
