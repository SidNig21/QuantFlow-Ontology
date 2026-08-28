# G8 bounded test-repair Builder receipt

Plain language: the governed-review test now checks the exact failure record, so a delivered record can no longer masquerade as a critic-completion failure.

## Immutable authority and candidate

| item | value |
| --- | --- |
| order | `docs/orders/WO-GOLDEN-G8.md` |
| starting authority HEAD | `7c743729cdbefe02f26b593504fde4d129be00c3` / tree `6ebc0fb8f8a34e620acff406aa8d5014903af347` |
| starting G8 Verifier evidence | `9004224b1ed3e332446be2230eed2fc3e2a0ea24` / tree `f48c5bb560fab5a543366abecd501582170676ac` |
| prior product candidate | `6a26340162148118c84f0148638bd36a32a3af99` / tree `1b242d47035745f356eb0f3ff2ec9beda584eb7c` |
| candidate parent | `7c743729cdbefe02f26b593504fde4d129be00c3` |
| product candidate | `61abfa5b23553f86a5c2d95facdf0473310fc44` / tree `94ef17e1876c68fcfb2713f4a2cf9f0d05a9d013` |
| evidence head | receipt-only commit directly on the product candidate; SHA/tree are reported in the final handoff |
| branch / publication | `wo-golden-g2`; not pushed; no branch switch or worktree/copy created |

The candidate commit contains exactly the authorized test correction and the
generated Atlas projection refresh required after the candidate state changed:

```text
packages/qf-kernel/src/r15-governed-review.test.ts
qf-atlas/ATLAS.md
qf-atlas/atlas.html
qf-atlas/atlas.json
```

The Atlas refresh changes commit/diff metadata only; its stable projection
fingerprint remains current. No generated schema artifact changed.

## Mechanical correction

The test now has a deterministic, non-persistent two-row reproduction with one
fixed same-millisecond timestamp. The old selector
`ORDER BY created_at DESC, id DESC` deterministically chooses
`receipt-delivered-ffffffff` over
`receipt-completion-failed-00000000`. The test then applies the repaired
payload identity selector and requires the exact completion-failure ID.

The live critic-return test keeps its existing fixture and all existing
assertions. It reads only delivery receipts for the exact review Task, filters
for `outcome=failed`, `phase=completion`, and
`reason_code=CRITIC_RETURNED_WITHOUT_EVALUATION`, requires exactly one matching
receipt, and retains the durable-reason, cancelled-review-Task, open-source-
Task, and single-replay-event assertions. No production helper, timestamp,
UUID generation, lifecycle behavior, acceptance rule, or assertion was
changed.

## Fail-capable red/restore-green proof

The deterministic reproduction's old selector was intentionally restored in
the test helper as bait. The repaired test caught it before candidate commit:

```text
command: bun test src/r15-governed-review.test.ts
temporary bait: selectCompletionFailureReceipts returned the highest UUID
exit=1
Expected: receipt-completion-failed-00000000
Received: receipt-delivered-ffffffff
8 pass / 1 fail / 66 expect() calls
```

The exact payload selector was restored before the candidate commit:

```text
command: bun test src/r15-governed-review.test.ts
exit=0
9 pass / 0 fail / 66 expect() calls
```

## Candidate-bound command evidence

The repaired test bytes used for the 20-run stability loop are identical to
the committed candidate bytes; that loop was green on every iteration. The
final candidate-bound loop was also green on every iteration.

| command | exit | result |
| --- | ---: | --- |
| 20× `bun test src/r15-governed-review.test.ts` (cwd `packages/qf-kernel`) | 0 each | every run: 9 pass, 0 fail, 66 expect |
| 10× `bun test src/r15-governed-review.test.ts` (cwd `packages/qf-kernel`) | 0 each | every run: 9 pass, 0 fail |
| `bun qa/run.ts governed-review` | 0 | 15 pass, 0 fail, 128 expect; focused production/kernel proof exit 0 |
| `bun qa/run.ts governed-review-live` | 0 | 9 pass, 0 fail, 66 expect; policy 4/4 |
| `bun qa/run.ts golden-g8-kernel-proof` | 0 | existing gate-owned-state, all 13 K1, internal-handler, and Law-B falsifiers red/green; final PASS |
| `bun qa/run.ts golden-g8-schema-lifecycle` | 0 | exact total 89; golden drift and `experimental` → `active` falsifiers red/green; final PASS |
| `bun qa/run.ts kernel-one-path` | 0 | no illicit env reads or `kernel.db` literals; final PASS |
| `bun qa/run.ts kernel-sole-writer` | 0 | PASS |
| `bun qa/run.ts kernel-sole-writer-app` | 0 | PASS |
| `bun test` (cwd `packages/qf-kernel`) | 0 | 108 pass, 0 fail, 420 expect |
| `bun run typecheck` (cwd `packages/qf-kernel`) | 0 | TypeScript check passed |
| `bun test` (cwd `qf-kernel-schema`) | 0 | 179 pass, 0 fail, 615 expect |
| `bun run generate` (cwd `qf-kernel-schema`) | 0 | generation completed; committed golden output unchanged |
| `bun qf-atlas/generate.mjs` | 0 | wrote the three generated Atlas projections |
| `bun qf-atlas/generate.mjs --check` | 0 | current; 406 files, 111 channels, 7 strip candidates |
| `bun qf-atlas/ratchet.mjs` | 0 | 3 baseline entries; HARD RED 0; unexplained coverage 0 |
| `git diff --check` | 0 | clean |

The G8 kernel proof emitted actual gate-owned state, including
`process_delta=0`, restored `root_delta=0`, and zero residue on the restored
run. The focused test teardown removed its temporary roots. No credential or
canonical user database state was opened, copied, or logged.

## Prior-candidate equivalence and scope proof

The product/QA path comparison from prior candidate
`6a26340162148118c84f0148638bd36a32a3af99` to this candidate listed only:

```text
packages/qf-kernel/src/r15-governed-review.test.ts
```

The exclusion check for that one repaired test exited `0`; the production
`packages/qf-kernel/src/governed-review.ts` comparison exited `0`; and the
production/config/QA comparison excluding the repaired test exited `0`.
The candidate commit's complete four-path list is recorded above. The current
worktree was clean immediately before this receipt was added.

## Packaged gate boundary and handoff

`bun qa/run.ts hermes-first-turn-synthetic` was intentionally not rerun. It is
the long packaged gate owned by the prior G8 Verifier evidence and was excluded
by the bounded repair instruction. The product/config equivalence checks above
prove this test-only candidate did not alter the packaged product surface.

The receipt-only evidence commit will be created directly on candidate
`61abfa5b23553f86a5c2d95facdf0473310fc44`. This is Builder evidence, not G8
acceptance; a fresh independent Verifier must decide whether the repaired
candidate closes the recorded nondeterminism.

## Judgment exercised

Because the production completion-failure helper returns no receipt ID, the
repair identifies the exact persisted receipt by its immutable completion
payload fields and requires one match; this preserves the existing contract
without changing the production API or introducing a second truth store. The
fixed-row reproduction is intentionally in-memory and test-local, so it proves
the UUID tie-break defect without writing synthetic durable receipts.
