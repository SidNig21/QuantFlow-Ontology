The built-in Dock now ships only the real Hermes runtime, keeps deterministic proof participation QA-only, and refuses old saved Claude rows without creating sessions.

# G6 Builder evidence after product candidate

status: **CLOSED — PASS WITH INHERITED G8/G12 REDS; INDEPENDENTLY VERIFIED**
order: `docs/orders/WO-GOLDEN-G6.md`
authority_head: `929de18c181f3d42eedede5b1ea3246108cc3a1d`
starting_evidence_head: `bd3135edfe7004b140874fd2dcbef16ddb433540`
starting_product_candidate: `0cd9f273e46fb0c8ca7d05847b1fd805b8817a65`
candidate_sha: `8dbc19162be9c42303fd79c3c942385a17726f31`
candidate_tree: `7cee1e3d8e8444d48c8048f344f44ef33db594e2`
candidate_parent: `929de18c181f3d42eedede5b1ea3246108cc3a1d`
evidence_head: `4e037c69268ffd4a62f0e9aa933686c6f8c3c93e`
independent_verifier_task: `01a04695-825e-7893-89fb-d0efb6ceec3c`
independent_verifier_verdict: **PASS WITH INHERITED G8/G12 REDS**
branch: `wo-golden-g2` (user-directed existing checkout; no branch switch)

## Candidate boundary

The product candidate contains exactly the approved G6 implementation/docs/deletions and generated Atlas output. The evidence receipts in this directory are a separate post-candidate commit. No dependency or lockfile changed, no Kernel schema or `execute()` path changed, no canonical database write was performed, and no G7/G11/G12 or real Claude/R19 work was undertaken.

Changed paths in the product candidate, exactly as committed:

```text
README.md
collab-electron/packages/components/src/WorkspaceGraph/WorkspaceGraph.tsx
collab-electron/scripts/package-lib/package-inspect.test.ts
collab-electron/scripts/package-lib/package-inspect.ts
collab-electron/scripts/package-lib/runtime-staging.test.ts
collab-electron/scripts/package-lib/runtime-staging.ts
collab-electron/src/main/agent-host.ts
collab-electron/src/main/dock-profiles.test.ts
collab-electron/src/main/dock-profiles.ts
collab-electron/src/windows/shell/src/dock.js
docs/DEBT.md
docs/DOCTRINE.md
docs/RESEARCH.md
docs/orders/GOLDEN-RUN.md
docs/proposals/CAPABILITY-REGISTRY.md
docs/proposals/V2-SCOPE.md
qa/gates/dev-dock-readiness.ts
qa/gates/dock-definition-launch.ts
qa/gates/dock-definition-launch/run.ts
qa/gates/dock-production-inventory.ts
qa/gates/kernel-one-path.ts
qa/gates/research-director-front-door.ts
qa/gates/windows-dock-species.ts
qa/run.ts
qf-atlas/ATLAS.md
qf-atlas/atlas.html
qf-atlas/atlas.json
species/claude-code/dock-profiles.json
species/claude-code/launch.json
species/claude-code/package.json
species/claude-code/packed/claude-code.aospkg
species/claude-code/packed/claude-code.meta.json
species/claude-code/packed/claude-code.mjs
species/claude-code/prompts/orchestrator.md
species/claude-code/prompts/worker.md
species/claude-code/qa-dock-profiles.json
species/claude-code/scripts/pack-agent.mjs
species/claude-code/src/claude-code.mjs
```

The eleven deleted species files and the retired `qa/gates/windows-dock-species.ts` are the only deletions. The current generic external integration, PTY, Canvas skill, TerminalTab, and shared viewer-item seams were not changed.

## Exact inventory proof

Frozen starting sets were P0 = 13 paths and Q0 = 19 paths from the Reader-accepted order. The candidate stages the exact required sets:

```text
P1C
species/hermes/dock-profiles.json
species/hermes/launch.json
species/hermes/packed/hermes.meta.json
species/hermes/tools-allowlist.json

P1R
species/hermes/packed/hermes.aospkg
species/hermes/prompts/research-director.md
species/hermes/prompts/worker.md
species/hermes/prompts/critic.md

Q1C (in addition to P1C)
tools/qf-proof-agent/dock-profiles.json
tools/qf-proof-agent/launch.json
tools/qf-proof-agent/packed/qf-proof-agent.meta.json

Q1R (in addition to P1R)
tools/qf-proof-agent/packed/qf-proof-agent.aospkg
tools/qf-proof-agent/packed/qf-proof-agent.mjs
```

The production inventory receipt reported `productionControls=4 productionResources=4 productionTotal=4`; QA reported `qaControls=7 qaResources=6 qaTotal=6`. Production runtime identity was `hermes-only`; QA addition was `qf-proof-only`. No production path contains a Claude or QA resource.

## Saved-state and refusal proof

Read-only canonical database observation: `C:\Users\rybow\.quantflow\kernel.db`, `1,175,552` bytes, SHA-256 `FD564B3A8E585FD38A7AAB758F58A7B3DA33B32C3DA77DB31BAA145C02D73F70`. The canonical database was not opened for writing. The observed database retained exactly seven definitions; relevant live counts were `agent_sessions=70`, `links=466`, `spawned_from=70`.

The seven current saved rows and the seven named fields were observed read-only as follows:

```text
name | role | package_ref | system_prompt_ref | runtime_profile | capability_groups | display_name
claude-code-orchestrator | claude-orchestrator | species/claude-code/packed/claude-code.aospkg | prompts/orchestrator.md | claude-code-orchestrator | ["desk.orchestrate"] | Market Researcher
claude-code-worker | claude-worker | species/claude-code/packed/claude-code.aospkg | prompts/worker.md | claude-code-worker | ["market.read"] | Market Researcher
hermes-critic | critic | species/hermes/packed/hermes.aospkg | prompts/critic.md | default | ["research.evaluate"] | Critic
hermes-orchestrator | orchestrator | species/hermes/packed/hermes.aospkg | prompts/orchestrator.md | default | ["desk.orchestrate"] | Orchestrator
hermes-research-director | orchestrator | species/hermes/packed/hermes.aospkg | prompts/research-director.md | default | ["desk.orchestrate"] | Research Director
hermes-worker | worker | species/hermes/packed/hermes.aospkg | prompts/worker.md | default | ["market.read"] | Market Researcher
hermes-worker-2 | worker2 | species/hermes/packed/hermes.aospkg | prompts/worker.md | default | ["market.read"] | Market Researcher
```

The cold-safe definition-launch gate registered the two saved Claude rows only in an in-memory Kernel fixture. For both rows `resolveDefinitionRuntime` threw `runtime package missing`, the availability projection was `available=false`, the launchable projection was `launchable=false`, and before/after refusal counts were `sessions=0, links=0, spawnedFrom=0`; `os_process_delta=0`. The source proof binds `qf:sessions:spawn` parsing and resolver-before-`admitAndStartSession`, and explicitly excludes precreated-session paths.

WorkspaceGraph now renders the exact neutral label `Agent session`; stored session IDs, definition IDs, `spawned_from` links, and saved definition identity remain Kernel-owned.

## Generic external CLI seam

`bun test collab-electron/src/main/integrations.test.ts` passed all 12 tests. The front-door gate reported `generic-external-cli-seam-preservation=true` after the real Research Director proof. Its `external-cli-seam` bait changed a copied protected seam, emitted the named red, restored the fixture, and the cleared normal rerun returned exit 0. The protected source files were byte-identical before and after the candidate proof.

## Process, roots, and inherited reds

Starting G6 evidence recorded no Bun/Electron process and no G6-owned root; unrelated Codex Node processes existed. Final post-gate census recorded no Bun/Electron process, no G6-owned `qf-g6`, staging, Dock inventory, readiness, front-door, or gate root, and no cleanup residue. Native readiness reported `electron_process_started=true`, `repository_artifacts_mutated=false`, and exit 0. Native front-door reported `owned_process_tree_remaining=0 electron_processes_remaining=0 hermes_processes_remaining=0 roots_remaining=0 repository_tree_unchanged=true`.

The independent Verifier's bounded matrix was `16 PASS / 3 INHERITED_RED`; those three reds are never called PASS: `kernel-one-path` (13 existing literal offenders; G8-owned), `package-inspect.test.ts` (12 pass / 3 Windows platform-fixture failures; G12-owned), and `hermes-launch-policy` (WSL `E_ACCESSDENIED` while creating fake Hermes; G12-owned). The G6 product gates themselves are green under native host access. Atlas reported `HARD RED 0`; the Builder transcript's pre-edit stale-map and missing-bait-directory observations remain historical harness observations, not additional G6-owned acceptance reds.

## Independent Verifier closure

Independent Verifier task `01a04695-825e-7893-89fb-d0efb6ceec3c` inspected immutable
candidate `8dbc19162be9c42303fd79c3c942385a17726f31` (tree
`7cee1e3d8e8444d48c8048f344f44ef33db594e2`), against parent authority
`929de18c181f3d42eedede5b1ea3246108cc3a1d` and evidence head
`4e037c69268ffd4a62f0e9aa933686c6f8c3c93e`. The candidate-to-evidence diff is
exactly the five G6 receipts in this directory: `AFTER.md`, `COMMANDS.tsv`,
`FALSIFIERS.tsv`, `GROUP-ACCEPTANCE.md`, and `VERIFIER-ACCEPTANCE.md`.

The Verifier independently confirmed exact P0/Q0 and P1/Q1 staging, four
Hermes production profiles/eight production paths, six QA profiles/thirteen
QA paths with exactly two qf-proof additions/five paths, the seven saved rows
and seven-field comparison, the canonical Kernel size `1,175,552` and SHA-256
`FD564B3A8E585FD38A7AAB758F58A7B3DA33B32C3DA77DB31BAA145C02D73F70`, saved
Claude availability=false/nonlaunchability, zero session/link/process deltas
on refusal, protected Hermes/front-door/Dock/Canvas/PTY/external-CLI behavior,
and all eight falsifiers red then exact-clear restore green.

Cleanup was independently observed: Atlas `HARD RED 0`, all 35 Verifier roots
absent, and no Bun/Electron process remained. G6 closes as **PASS WITH INHERITED
G8/G12 REDS** only; the inherited reds remain owned by G8/G12 and are not
reclassified or repaired by G6.

Judgment exercised: because the user explicitly directed work in the existing `wo-golden-g2` checkout, I preserved that branch and committed locally rather than creating a worktree or switching branches. Because the managed sandbox denied native process/build/index access, the affected proof commands were rerun with host permission; their outputs are recorded as native-host evidence, while the original sandbox permission failures remain inherited observations rather than product claims.

G6 is closed on the exact bounded result above. Full G8/G9 ordering and R18
freeze remain unchanged; no G7/G11/G12 broad work or packaged release PASS is
implied by this closure.
