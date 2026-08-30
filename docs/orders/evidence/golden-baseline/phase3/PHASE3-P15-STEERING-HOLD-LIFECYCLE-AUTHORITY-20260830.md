# Phase 3 P15 steering-hold lifecycle authority — 2026-08-30

The deterministic steering-hold worker detaches its delivery loop and separately waits for close, so valid steering deliveries can be swallowed by an unowned task.

status: **FRESH SEMANTIC READER YES / YES / EXISTING TWO-FILE RESPONDER SCOPE AMENDED**

- Reader task: `01a05212-f0e4-7101-a0d9-8e59df8a3f08`
- Reader adjudication: **YES / YES — real P15 worker steering-hold lifecycle defect**
- authority base commit: `d8e2f0e764c602592b2da383882b93b9d3bc8719`
- authority base tree: `41b193342807fc1d8696b28a565a9045e17920ee`
- existing responder path: `collab-electron/cli/qf-hermes-synthetic-responder.mjs`
- existing focused test path: `collab-electron/cli/qf-hermes-synthetic-responder.test.ts`

Scope reason: in `QF_FOUNDER_STEERING_HOLD=1`, detached `void consumeDeliveries(reader)` plus a separate `waitForClose()` leaves delivery consumption unowned and its completion/errors unobserved. The owner remains the already-authorized deterministic responder and focused test; delivery contracts, gate timing, Main, Kernel, gateway, peer identity, and production behavior are correct and unchanged.

## Preserved current dirty set

This authority task does not touch or stage the ten authorized dirty paths. Their identities before this authority commit are:

| Unstaged path | Working blob | Per-file binary-diff hash |
| --- | --- | --- |
| `collab-electron/cli/qf-hermes-synthetic-responder.mjs` | `868abd3d73628bf02336686b1fcc0193b0366210` | `778cda3347aae9767a6d3768eba79f6e39594fc7` |
| `collab-electron/cli/qf-hermes-synthetic-responder.test.ts` | `e61c1698b608267362692e43676a12303475eea4` | `6f4ce8e8b7f80728c0950f3cff61ae5b1b037e43` |
| `collab-electron/src/windows/shell/src/cable-overlay.js` | `1d365e7d631ee134cee879e8c4468df327370ec3` | `f38f418d66e5b614b12280c7bba2ba3abfdab34c` |
| `collab-electron/src/windows/shell/src/cable-overlay.test.ts` | `05d707c06787c6f3ee3aeb6ba0de86f0e80a4903` | `315c5e4f105060f691aa99d88a1140aa903625fe` |
| `collab-electron/src/windows/shell/src/research-world.js` | `8a42c0ae8c1c465c42b37132f43da4a3442cc06f` | `d92ae622c5270d9387e57c9b8f45540733fdf6a9` |
| `collab-electron/src/windows/shell/src/research-world.test.ts` | `9e66ef7ba1f6e54743154e4e39a12c441192df21` | `394bef7b31db51b18256a49443a00e1924813ae7` |
| `qa/gates/pre-r18-coherence.ts` | `42ca268bb96f4e198f0aa06f88b33f1594341b91` | `3ddfcbc8f431542057e0a6ad2ccb6fa36d9e2235` |
| `qf-atlas/ATLAS.md` | `4e05cc86392d7326b006632dc08bdc39b1014354` | `cd1eaa550216b0de257b738724bf0bd2ae9d3dcb` |
| `qf-atlas/atlas.html` | `f5f7c068de450a808fa2224a7691628608463e74` | `af1687c72eb71e7c5f82e2866428d630a9ea3af8` |
| `qf-atlas/atlas.json` | `285ec3c902b9fef4b9dc470428a906abcc30bc24` | `dad52614ea6a466026a492eb6c533f380a94c55d` |

The Builder may resume this dirty set under existing authority and apply the lifecycle correction only within the same two responder files.

## Exact owned-loop contract

In `QF_FOUNDER_STEERING_HOLD=1`, after activation and the initial exact assignment receipt, emit the existing steering-hold readiness receipt, then execute `await consumeDeliveries(reader); return`. The delivery loop is the owned lifetime of the hold worker: reader close ends the loop and settles the worker promise; delivery-loop failure is observed by the worker rather than swallowed.

Only the normal research path may start `consumeDeliveries(reader)` in the background concurrently with its tool turn. That existing normal-path concurrency remains unchanged. The steering-hold path must not also call a separate `waitForClose()`, detach a second consumer, run two delivery loops, or proceed into a research tool turn.

The exact three delivery contracts remain `qf.task.assignment.v1`, `qf.task.steering.v1`, and `qf.task.second_opinion.v1`, with their existing strict fields, IDs, received receipts, acknowledgements, and rejection behavior. The existing strict second-opinion/critic-Mission dispatch authority remains binding. The P15 gate timeout remains exactly 15 seconds.

## Required focused pushable-reader/stdout proof

Use the focused test's pushable reader and captured stdout; do not use sleeps or loose text matching:

1. Start one hold worker and observe its exact readiness after activation/initial assignment receipt.
2. Push one exact steering delivery and require exactly one received receipt plus exactly one acknowledgement carrying the same exact delivery/task/review identity required by that contract.
3. Push a second exact redirect delivery and require a second, distinct received receipt and acknowledgement with its same exact ID; no overwrite, coalescing, or reuse of the first ID.
4. Push malformed/wrong-contract delivery and require no received receipt and no acknowledgement for it.
5. Close the reader and require the hold worker promise to settle; restoring detached consumption plus separate close wait must RED on missing/late acknowledgement or unowned settlement.
6. Retain and pass the existing worker2 and critic-path tests without weakening their identities, strict parsing, or lifecycle assertions.

## Preserved authority and stops

No delivery schema, acknowledgement content, Task/review/session ID, peer identity, Main/Kernel/gateway behavior, gate assertion, 15-second timeout, normal research concurrency, tool turn, product behavior, oracle, fixture data, or retry semantics change. No sleep, polling grace, regex/substring receipt match, loose text parser, swallowed rejection, extra consumer, or raw governed-review shortcut is authorized.

P14-A parser/selection mutation remains closed and measurement pending. P18/candidate freeze, independent Verifier acceptance, Golden designation, `main`, every remote ref, and R18 remain closed. No candidate is permitted until P01-P17 are green. Any path outside the existing two responder files or semantic expansion stops for new authority.
