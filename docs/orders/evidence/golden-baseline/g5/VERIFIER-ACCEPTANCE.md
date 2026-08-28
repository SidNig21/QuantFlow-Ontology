# G5 independent verification

status: PENDING INDEPENDENT VERIFIER
candidate_sha: 0cd9f273e46fb0c8ca7d05847b1fd805b8817a65
candidate_predecessor: cc8d73173b58cca11ddfd9c4d0a561cc79dbf268
reader_task: 01a0426f-d4bf-7413-b974-643f935131d8
reader_verdict: YES / YES
reader_authority: cc8d73173b58cca11ddfd9c4d0a561cc79dbf268

The independent Verifier must inspect immutable candidate 0cd9f273e46fb0c8ca7d05847b1fd805b8817a65, tree df9a4f11c421ed1c18418bbb8a73d0a5a756cd27, parent cc8d73173b58cca11ddfd9c4d0a561cc79dbf268, and rerun only the bounded G5 proof matrix plus the inherited packaged observation as authorized. It must prove exact accepted deletion preservation, all G5 normal selectors and six falsifier/restore pairs, and no changed product bytes beyond the preserved repair.

## Independent Verifier matrix

- Dedicated transport predicate: `bun test collab-electron/src/main/peer-delivery.test.ts`; the Builder reported 1/1 green in task `01a04617-2cd5-7a42-bae8-bdab09648337`, but no durable output path is available, so no log is invented.
- Dedicated lifecycle proof: `bun test collab-electron/src/main/agent-host-lifecycle.test.ts`, with separate old-red and new-green receipts. The known combined Bun mock-contamination invocation is not an accepted matrix command.
- Changed surfaces: peer-delivery predicate truth table and catch-all, lifecycle registry/explicit-close/disposal/cancel proofs, Kernel sole-writer source/falsifiers, Hermes safe compilation, source-backed old-impossible matcher, and pure missing/duplicate/task-mismatch/artifact-mismatch/later/reordering proofs.
- Transport observation: exactly one Director [QuantFlow RESULT for <task_id> from worker] PTY receipt from qf.pty.capture, correlated to durable task.completed and transport task/artifact identity, before exactly one result_return; missing, duplicate, mismatched, or later is red.
- Preserved G5 surfaces: normal consumer census, saved-state, retired-route, Dock, launch policy, supporting runtime, ontology, responder, Kernel, lifecycle old-red/new-green, and exact six falsifier/restore receipts.
- Packaged reproduction: verify the inherited late shape and immutable packaged responder bytes/hash without claiming packaged PASS; no critic ontology read, Evaluation, or Report remains a G5 deletion regression claim.
- Cleanup ownership: verify no G5-owned process/root leak with processes=0, roots_remaining=0, leaked=[] on the fresh candidate matrix; separately verify the preserved EACCES/orphan pty-sidecar/root is the pre-existing G12-owned Windows operations red and do not clean or terminate it. The preserved prior packaged run has roots_remaining=1 and one leaked root, so it is not a PASS and must not be rewritten as roots_remaining=0.
- Authority: the standing Golden rule permits assignment of that named out-of-group pre-existing red when current-group non-regression is independently proved; any earlier/different failure or G5 regression fails.

The Verifier must not repair the candidate, weaken assertions or cleanup, claim the packaged chain PASS, run Atlas, push, or reorder G8/G9. This receipt is intentionally pending; the Builder does not self-verify.
