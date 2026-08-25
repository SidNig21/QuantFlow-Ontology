# G2 Rewrite 2 — Semantic Reader Acceptance

date: 2026-08-24
reader-task: 01a0377a-970f-7c41-88be-bc76ac949cfe
authority-sha: 4ce2fd021b4a821d597cf91d1542c63c30a8517b
outcome: **A — YES / YES**
builder-authority-granted-by-this-receipt: no — NEXT rotation is separate

## Reader verdict

The fresh read-only Reader bound local and origin G2 authority to the exact SHA,
treated the preserved Builder diff as non-authoritative, and derived the
completion contract from accepted authority and source rather than from the two
observed runs.

1. **Can every acceptance gate fail? YES.** The topology is red on zero or
   duplicate Director, unknown or duplicate sessions, hermes-worker-2,
   malformed/missing/duplicate spawned_from, or incorrect per-role/total
   counts. Cleanup is red on any nonzero owned-process, Electron, Hermes, or
   root count. Existing boundary/profile falsifiers remain independently
   breakable.
2. **Does every deliverable have exactly one meaning? YES.** Zero workers means
   no worker row exists at the front-door observation instant, never that the
   legacy no-recruit fixture was enabled. One worker means exactly one
   hermes-worker row with exactly one correct spawned_from link.

## Authority and source proof

The semantic completion point T_fd is the return of the real form to the UI with
the exact Mission state visible and the Research Director tile present. The
accepted WO-RD-1 front-door contract stops there and does not wait for or assert
worker behavior. Pre-R18 separately requires immediate Mission visibility after
submission resolution, before worker completion.

The current source sequence is ordered:

1. question submission returns after Director admission and activation;
2. native orchestration calls onStarted and returns;
3. the already-running synthetic Director later performs the independent tool
   calls that query, create and start hermes-worker.

Therefore worker recruitment is genuinely asynchronous relative to T_fd. WO-RD-2
owns the later completion point that requires exactly one specialist and its
delegation/Task lineage.

Primary inspected anchors:

- docs/orders/WO-RD-1.md — front-door completion and falsifiers;
- docs/orders/WO-RD-2.md — later specialist/delegation completion;
- docs/orders/WO-PRE-R18-COHERENCE.md — immediate Mission reveal;
- collab-electron/src/main/ipc-kernel.ts — question/admission return path;
- collab-electron/src/main/native-tui-orchestration.ts — onStarted/return order;
- collab-electron/cli/qf-hermes-synthetic-responder.mjs — later worker tool calls;
- qa/gates/research-director-front-door.ts at the bound authority SHA;
- both completed Rewrite 2 observational logs.

## Exact finite invariant

At T_fd:

- Director sessions added = exactly 1;
- hermes-worker sessions added = 0 or exactly 1;
- unknown/other sessions added = 0;
- duplicate Director or worker sessions = 0;
- Director spawned_from links added = exactly 1;
- if worker exists, worker-to-hermes-worker spawned_from links added = exactly 1;
- total new sessions = 1 + observed worker count;
- total new spawned_from links = 1 + observed worker count.

The gate may not use a greater-than-or-equal count and may not enable the legacy
no-recruit fixture.

## Cleanup

The retained cleanup correction preserves acceptance meaning. It changes only
test-owned capture/convergence ordering and still requires all four cleanup
counts to be exactly zero.

## Result

Rewrite 2 Outcome A is semantically accepted. NEXT may separately reopen the
same Builder for the finite-topology gate correction and no other G2 scope.