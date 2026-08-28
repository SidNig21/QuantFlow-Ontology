# G5 evidence after immutable candidate freeze

status: CANDIDATE / PENDING INDEPENDENT VERIFIER
starting_sha: f29dc3603ee969e9c6573f0a91ce0a4bc0f5b806
accepted_g5_candidate_ancestor: 82011c5f934aca5d15b692bed883d1addfc19245
candidate_sha: 0cd9f273e46fb0c8ca7d05847b1fd805b8817a65
candidate_tree: df9a4f11c421ed1c18418bbb8a73d0a5a756cd27
candidate_predecessor: cc8d73173b58cca11ddfd9c4d0a561cc79dbf268
frozen_g8_authority_head: a2bdf33669b91b941f73441e889c2f9502374eb2
reader_authority: cc8d73173b58cca11ddfd9c4d0a561cc79dbf268
reader_task: 01a0426f-d4bf-7413-b974-643f935131d8
reader_verdict: YES / YES
builder_authority: evidence-only finalization

## Exact immutable product candidate

The accepted G5 deletion/product candidate remains inherited from 82011c5f934aca5d15b692bed883d1addfc19245. The immutable candidate is commit 0cd9f273e46fb0c8ca7d05847b1fd805b8817a65, with tree df9a4f11c421ed1c18418bbb8a73d0a5a756cd27 and parent cc8d73173b58cca11ddfd9c4d0a561cc79dbf268. It contains the preserved six-file causal transport/result-ordering diff approved by the final Reader contract:

- collab-electron/src/main/agent-host.ts;
- collab-electron/src/main/agent-host-lifecycle.test.ts;
- collab-electron/src/main/peer-delivery.ts;
- collab-electron/src/main/peer-delivery.test.ts;
- qa/gates/hermes-research.ts; and
- qa/gates/kernel-sole-writer-app.ts.

The candidate's changed surface preserves the transport-owned pending-result predicate, the two causal lifecycle guards, the sole-writer exception boundary, and the exact Director [QuantFlow RESULT for <task_id> from worker] receipt ordering before result_return. No G5 evidence file or NEXT.md change is part of the product candidate.

## Dedicated transport and lifecycle receipts

- Transport predicate command: `bun test collab-electron/src/main/peer-delivery.test.ts` — Builder reported 1/1 green, but no durable output file is available in this checkout. Receipt reference: Codex Builder task `01a04617-2cd5-7a42-bae8-bdab09648337`. No synthetic log path is claimed.
- Lifecycle command: `bun test collab-electron/src/main/agent-host-lifecycle.test.ts` — 1 pass, 0 fail, 8 expect() calls at `C:\tmp\qf-g5-agent-host-lifecycle-new-green.log`.
- The known combined Bun mock-contamination invocation is not an accepted matrix command and is not used as evidence here.

## Normal selector receipts

The normal consumer-census and saved-state selectors are PASS in the preserved receipts. The retired-route, Dock launch, Hermes launch-policy, Kernel sole-writer, and Electron build receipts are PASS. The normal hermes-first-turn-synthetic receipt is the sole inherited red and is not claimed as packaged PASS.

## Focused receipts

- C:\tmp\qf-g5-responder-test-3.log: 7 pass, 0 fail, 27 expect() calls.
- C:\tmp\qf-g5-kernel-falsifier.log: 1 pass, 0 fail, 6 expect() calls; old nested params refused before Run creation and repaired path created one Run.
- C:\tmp\qf-g5-supporting-runtime-tests.log: 17 pass, 0 fail, 115 expect() calls.
- C:\tmp\qf-g5-focused-ontology-gateway.log: 6 pass, 0 fail, 83 expect() calls.
- C:\tmp\qf-g5-agent-host-lifecycle-old-red.log and C:\tmp\qf-g5-agent-host-lifecycle-new-green.log: lifecycle old red and new green preserved; Director-before-result_return remains required.
- C:\tmp\qf-g5-repair-20260827\22-hermes-gate-correction-safe-compile.log: safe Bun compilation green, 14 modules.
- C:\tmp\qf-g5-repair-20260827\23-hermes-result-matcher-in-memory-proof.log: no-launch matcher proof green; missing, duplicate, task-mismatch, artifact-mismatch, and later receipts reject; corrected Director matcher accepts; old synthetic matcher is impossible; reorder rejects and exact restore passes.

## Durable inherited packaged-red receipt (G12-owned cleanup red)

command: bun qa/run.ts hermes-first-turn-synthetic
output_path: C:\tmp\qf-g5-repair-20260827\21-hermes-first-turn-synthetic-inherited-g8-red.log
start_sha: f29dc3603ee969e9c6573f0a91ce0a4bc0f5b806
candidate_predecessor: cc8d73173b58cca11ddfd9c4d0a561cc79dbf268
packaged_product_sha: cc8d73173b58cca11ddfd9c4d0a561cc79dbf268
packaged_at: 2026-08-27T08:53:25.366Z
product_boundary: result_return reached; the old gate observation then failed
old_gate_observation_failure: expected exactly one concrete qf.peer-notification result receipt, got 0
corrected_observation: exact [QuantFlow RESULT for <task_id> from worker] line consumed from qf.pty.capture, correlated to task.completed and transport task/artifact identity, exactly once before result_return
ownership: G12 Windows operations for the proven pre-existing cleanup red; no G5 packaged PASS claimed

Exact preserved output:

hermes-first-turn-synthetic: package-identity={"commitSha":"cc8d73173b58cca11ddfd9c4d0a561cc79dbf268","packagedAt":"2026-08-27T08:53:25.366Z"}
windows-hermes-research: FALSIFY RED future Dataset after as_of refused; FALSIFY GREEN no downstream objects
hermes-first-turn-synthetic: dock_admission=pass definition=hermes-research-director session=3104fa4d-30a4-4400-bf26-87bb2d7dab8c
hermes-first-turn-synthetic: launch_readiness=pass pty_session=f8c8b0f852a0efba
hermes-first-turn-synthetic: FAIL expected exactly one concrete qf.peer-notification result receipt, got 0
hermes-first-turn-synthetic: FAIL expected exactly one concrete qf.peer-notification result receipt, got 0
hermes-first-turn-synthetic: cleanup-leak path=C:\Users\rybow\AppData\Local\Temp\qf-hermes-first-turn-synthetic-Fz8BQs code=EACCES attempts=1
hermes-first-turn-synthetic: temp-cleanup roots_created=2 roots_remaining=1 retried=0 preexisting=18 leaked=["C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-hermes-first-turn-synthetic-Fz8BQs"]
hermes-first-turn-synthetic: FAIL temp cleanup did not reach roots_remaining=0 and leaked=[]
FAIL  hermes-first-turn-synthetic

The product reached result_return before the old impossible matcher failed. This run is not a packaged PASS. The cleanup EACCES/orphan pty-sidecar/root is a proven pre-existing G12-owned Windows operations red and is preserved at C:\Users\rybow\AppData\Local\Temp\qf-hermes-first-turn-synthetic-Fz8BQs; no cleanup or termination was performed. The preserved run remains roots_remaining=1 with one leaked root; roots_remaining=0 is not claimed for that run.

## Six falsifier/restore pairs

FALSIFIERS.tsv is the exact pair ledger. Each falsifier actual exit is 1, each immediate normal rerun exit is 0, each named defect is present, and status was unchanged after every pair. The original pre-repair protected-consumer attempt is retained separately at C:\tmp\qf-g5-falsifier-pairs-20260827\02-protected-consumer-falsifier.log and is not counted as a passing pair; the repaired receipt is the one in FALSIFIERS.tsv.

## Mechanical harness old-red/new-green receipt

Before the one-line condition repair, protected-consumer produced FALSIFIER unexpectedly green: protected-consumer at C:\tmp\qf-g5-falsifier-pairs-20260827\02-protected-consumer-falsifier.log. After the repair, the same falsifier produced the named protected current file missing issue and the normal selector restored at exit 0, recorded at C:\tmp\qf-g5-falsifier-pairs-20260827\02-protected-consumer-falsifier-repaired.log and C:\tmp\qf-g5-falsifier-pairs-20260827\02-protected-consumer-normal-repaired.log.

## Closure state

G5 is a candidate pending the independent Verifier. The Builder did not rerun tests, Atlas, or the packaged gate in this finalization pass and does not self-verify. The standing Golden rule permits assigning the proven pre-existing out-of-group cleanup red to G12 because current-group non-regression is independently provable; any different failure, G5 regression, or unowned cleanup leak fails closure.

## Independent Verifier matrix

The Verifier must inspect candidate 0cd9f273e46fb0c8ca7d05847b1fd805b8817a65 (tree df9a4f11c421ed1c18418bbb8a73d0a5a756cd27, parent cc8d73173b58cca11ddfd9c4d0a561cc79dbf268) and prove: exact accepted deletion preservation; all G5 normal selectors and six falsifier/restore pairs; the dedicated transport predicate and lifecycle commands; Kernel sole-writer and Hermes safe-compile/source/in-memory ordering proofs; exact Director [QuantFlow RESULT ...] receipt correlated to task.completed and transport task/artifact identity exactly once before result_return; unchanged focused G5 proofs; immutable packaged responder bytes/hash; and the inherited packaged reproduction's exact late shape with no G5 regression. Any fresh candidate run must show no G5-owned process/root leak (processes=0, roots_remaining=0, leaked=[]), while the preserved prior run remains the named G12-owned EACCES/orphan pty-sidecar/root red with roots_remaining=1 and one leaked root, and is not claimed as PASS. The Verifier must not repair, weaken, clean, rerun beyond the bounded matrix, run Atlas, push, or self-verify.
