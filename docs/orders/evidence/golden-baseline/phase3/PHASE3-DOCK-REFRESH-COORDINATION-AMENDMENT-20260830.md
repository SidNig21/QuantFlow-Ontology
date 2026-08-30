# Phase 3 Dock refresh-coordination amendment — 2026-08-30

This proposed three-file amendment replaces a dropped overlapping Dock invalidation with a coalesced single-flight refresh whose newest complete pass wins.

status: **FRESH READER RECHECK REQUIRED / BUILDER CLOSED / THREE FILES ONLY IF ACCEPTED**

- defect Reader task: `01a05212-f0e4-7101-a0d9-8e59df8a3f08`
- defect verdict at source: **YES / YES — finite Dock refresh-coordination product repair**
- source commit: `4c9964dff57b08c9b9d3d39c6e0bafa37a7721e6`
- source tree: `547c08c5718d06607c7cab466f1f833faf6e8323`
- sole parent: `e582e8820622ca7cbfaf9b10584c8571d8079979`
- amendment approval: **PENDING — a fresh Reader must recheck this exact amendment commit before any Builder**

The defect verdict bounds the amendment but does not approve it. This commit changes authority/evidence only and authorizes no executable mutation.

## Proposed exact surface

If a fresh Reader accepts this amendment and a later receipt/rotation opens it, only these paths are editable:

- `collab-electron/src/windows/shell/src/dock.js`
- `collab-electron/src/windows/shell/src/dock.test.ts`
- `qa/gates/pre-r18-coherence.ts`, proof surface only

No other product, test, gate, oracle, Kernel, Canvas, IPC, lifecycle, or projection path is editable.

## Coalesced single-flight contract

Replace the current `if (refreshing) return` dropped-invalidation behavior. At most one refresh pass may execute at a time. A refresh request arriving while a pass is in flight marks one pending/dirty refresh instead of starting another pass or disappearing. Each pass reads a fresh complete set of runtime state, definitions, Kernel sessions, and Tasks; it publishes only that internally consistent complete snapshot, never a mixture of values from different passes.

After a pass completes, if any request arrived during that pass, run another fresh complete pass. Continue until a pass completes with no request received during it. Multiple overlapping requests coalesce into the pending bit rather than a queue or concurrent storm. The final newest complete pass is the rendered winner; an older completion must never overwrite it.

A read failure must clear the in-flight state through the normal completion/finally path and preserve the ability of a pending or later request to run a fresh pass. Failure may surface honestly, but it must not permanently wedge refresh, create concurrent retries, or publish a partial/mixed snapshot.

## Preserved participant invariant

For the same participant/session identity after successful normal teardown and reopen, the exact cross-surface invariant remains: Kernel session `closed`, Dock runtime `stopped`, work/Task `completed`, and recovery `restartable`. Kernel, Canvas, Dock, and Inspect must agree on that same ID and meanings. Refresh coordination changes delivery of the newest complete read snapshot only; it does not change lifecycle transitions, identity, status vocabulary, restart behavior, work completion, or authority ownership.

## Mandatory fail-capable baits

1. Restore `if (refreshing) return`, deliver terminal invalidation during an older active/running pass, and RED because Dock paints stale `active`/`running` while Kernel/Canvas/Inspect show the same ID terminal/closed/stopped/completed.
2. Restore coalescing, overlap an initial active/running pass with a terminal snapshot request, and GREEN only when the second complete pass paints the terminal snapshot and newest pass wins everywhere.
3. Send multiple overlapping requests and prove they are bounded/coalesced: never concurrent, no unbounded queued pass per request, and fresh passes continue only while a request arrived during the preceding pass.
4. Force one runtime/definition/Kernel-session/Task read failure and prove refresh is not permanently wedged: no partial publication, in-flight state clears, and a pending or later request completes a fresh full snapshot.
5. Instrument concurrency and RED on more than one simultaneous refresh pass or recursive refresh storm.
6. Run the real unchanged P13/P16 assertion and require the same participant ID to read Kernel closed, runtime stopped, work completed, recovery restartable across Kernel/Canvas/Dock/Inspect after normal teardown and reopen.

## Preserved authority and stops

All current P13/P16 gate assertions remain unchanged except the added fail-capable overlap proof instrumentation inside its already-authorized proof surface. No polling delay, sleep-as-proof, status normalization, filtered stale row, synthetic event, duplicate identity, weakened equality, fallback snapshot, or assertion removal is permitted.

Earlier lifecycle, lineage, Run-result, settlement, production-continuation, pre-R18 sequencing, and oracle-hash repairs remain binding. The oracle file is unchanged. P14-A parser/selection mutation remains closed and measurement pending; P15 is not repaired or closed here.

P18/candidate freeze, independent Verifier acceptance, Golden designation, `main`, every remote ref, and R18 remain closed. No candidate is permitted until P01-P17 are green. Any fourth executable path or semantic expansion stops for new authority.
