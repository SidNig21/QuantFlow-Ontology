# G9 repair Builder report

This repair makes Reports depend on exact, durable research evidence and proves each bounded failure with a real isolated red/restore-green run.

## Immutable identities and evidence binding

- Scope: `WO-GOLDEN-G9`
- Delegated checkout parent: `314616a16b7ffc84ca4025ed4e958a3db0e1f4d4`
- Delegated checkout tree: `5744136e2fa5813c0c81a00a48dd9baf675da2c3`
- Repair product ancestor: `4ef49077b2b423601c02b043de82b34d231bb7f5`
- Repair product ancestor tree: `bdba7c9540122288866bed6fb4aa57952c6f025e`
- Immutable product candidate: `2167a5e6085095c12d4b844987f3ceaeaa78a135`
- Immutable product candidate tree: `15bbd9e3bcba80c4b35e6f32722dd9afc6390ab5`
- Candidate parent: `314616a16b7ffc84ca4025ed4e958a3db0e1f4d4`
- Read-only evidence authority bound by this report: `f7e841ff3e075bd49ed70bf8da79c2409ca5c899`
- Read-only evidence authority tree: `69ffb780e692ae5cdbd532bbc3dba5b6b4006e6f`

Every acceptance receipt in this report is explicitly tied to the read-only
evidence authority above. The evidence-body commit is deliberately not
self-claimed here; a separate final receipt records its immutable SHA/tree
after this report, manifest, and matrix have been committed.

## Bounded product changes

The product candidate changes exactly these seven paths:

- `packages/qf-kernel/src/execute.ts`: carries the exact durable source-work `run_id` into the successful `task.completed` event when the existing support binding is present, rejecting malformed or ambiguous bindings.
- `packages/qf-kernel/src/governed-review.ts`: requires the exact durable source-work row, validates task/run/artifact identity across completion evidence, and emits the canonical four-key Report envelope without a top-level `authority_context`; the existing durable five-field lineage remains in support metadata.
- `packages/qf-kernel/src/g9-report-authority.test.ts`: adds fail-capable zero/multiple/mismatch/non-trajectory evidence, restart, exact retry, refusal, self-review, and canonical-shape cases.
- `qa/gates/report-authority.ts`: replaces source-pattern and dummy-root checks with isolated executable F01–F14 break/restore probes plus actual child/root cleanup observation.
- `qf-atlas/ATLAS.md`, `qf-atlas/atlas.html`, `qf-atlas/atlas.json`: regenerated projections only.

`collab-electron/src/main/kernel.ts` was inspected and unchanged: its durable
finalizer already resolves current and historical persisted identities without
a process-local authority map. No schema/golden, dependency, G8, G10–G12,
R18, Canvas, ordinary trajectory-writer, or real-world execution path changed.

## Exact candidate Git-tree-byte hashes

Command basis: `git ls-tree` followed by `git cat-file blob` at candidate
`2167a5e6085095c12d4b844987f3ceaeaa78a135`, then SHA-256 over those exact bytes.
No checkout bytes, CRLF conversion, or working-tree read was used. The five
hashes previously reported from checkout bytes are corrected here: the
governed-review test, Kernel finalizer, governed-review publisher, R12 test,
and gate registration now have their committed-tree values.

| path | candidate SHA-256 |
| --- | --- |
| `collab-electron/src/main/governed-review.test.ts` | `0c216f38ca9705598afcba40e0e5722a35dbf040c3e6b2c1e7a77bba3ce4e42d` |
| `collab-electron/src/main/index.ts` | `67dbf6f8d697c671d893e0d8f72e2ce39d69b5dbf032ac5e22c01a68f3c9a431` |
| `collab-electron/src/main/kernel.ts` | `7d1654035833c6609564757542053924236b5108123d89afb703b95e4dbad5a0` |
| `collab-electron/src/main/ontology-gateway.test.ts` | `9788c58d56d377e67844dc213681fbd99caf5d348eddcce4881e452ea0ff7551` |
| `collab-electron/src/main/research-world-projection.ts` | `95a6db85179b6687d655fb979d47242c1210cee886d06a75fd42212f5fe6a72e` |
| `collab-electron/src/main/research-world.test.ts` | `506ef20296c5f32fed85c2dfac82978283858c64c95f8d7d58024ac220f26909` |
| `packages/qf-kernel/src/attach-kernel-drift.test.ts` | `6125a8177a6bd677275b6c964c5b297c1856ed65231178853ea28577bb169da2` |
| `packages/qf-kernel/src/execute.ts` | `8ab366ebda6f6ace81bea93bce3304c7814f81483dbdf2fbf02b66dd2a128a3a` |
| `packages/qf-kernel/src/g9-report-authority.test.ts` | `e58bbcffde68b87009df3315a0cc3b188517e7591fbb1a9f7b62a5082f2bbc6a` |
| `packages/qf-kernel/src/governed-review.ts` | `3742d61bb49e3e33395f9723d42990a0532d94346eb101237dc6d10075c110c1` |
| `packages/qf-kernel/src/index.ts` | `e51382dfe6eadda5a6969fdd11de227cb64734e64e8b9c04fe9d3cee86736cda` |
| `packages/qf-kernel/src/portable.ts` | `e5bfa150c87b7e7d08e888a7745917112bdf650f273e499c1ea461f666ca12cb` |
| `packages/qf-kernel/src/r12-independent-critic.test.ts` | `d71217243dc07e7acab6d29e4ea7d3b995bb793750ffab3f58245bae3c5aadea` |
| `packages/qf-kernel/src/r15-governed-review.test.ts` | `bfa59aa45d66756660f01ba7bdebc310bdac3c0530618cb1a62d977cb0d1ef6d` |
| `qa/gates/hermes-research.ts` | `abaa1f644efc58907635f7f1d28affbbf452850b44645278919ad66c8fa7da23` |
| `qa/gates/report-authority.ts` | `e339c82d4596699683a0a0be5f708e191681bfc1f57c0b3dda77165cdaf8e4be` |
| `qa/run.ts` | `633995f78c01ea2745d14f5aa74a27cf26a55b1d62d5a265ef8ac7bb9ae4ab44` |
| `qf-atlas/ATLAS.md` | `17d0967413a2cddc6855e428ff7f444ad48c62a616d187134d15d259a529e66b` |
| `qf-atlas/atlas.html` | `4c3f08c1bf75f0a580333f277a3fb3db8bf10e2a3bb4b53dbb5e9d387828eaff` |
| `qf-atlas/atlas.json` | `9039159654d73b3ac2ddaa7d0ba9530349935a7fd76dd32ab242ef8db50b157a` |

## F01–F14 executable falsifier receipt

Command: `bun qa/run.ts report-authority` at the immutable candidate. Each
probe mutates an isolated in-memory or owned file-backed fixture, observes a
named failure with exit 1, restores the exact state, and observes exit 0.

| id | executable red receipt | restored green receipt |
| --- | --- | --- |
| F01 | `ordinary-report-relabel RED exit=1 ordinary completion is not one trajectory Artifact` | `GREEN exit=0 restored runtime invariant passed` |
| F02 | `duplicate-publisher RED exit=1 successful Report publisher cardinality is report=2 publication=1 gates=2` | `GREEN exit=0 restored runtime invariant passed` |
| F03 | `lineage-bypass RED exit=1 record_evaluation requires a running governed review Task` | `GREEN exit=0 restored runtime invariant passed` |
| F04 | `worker-evidence-cardinality RED exit=1 Run lacks exact worker evidence binding: f04-run` | `GREEN exit=0 restored runtime invariant passed`; the isolated probe also exercises zero, multiple, mismatched-run, and non-trajectory candidates |
| F05 | `current-uniqueness RED exit=1 current authority cardinality is 2` | `GREEN exit=0 restored runtime invariant passed` |
| F06 | `supersession-loss RED exit=1 prior publication is not explicit history` | `GREEN exit=0 restored runtime invariant passed` |
| F07 | `context-crossing RED exit=1 distinct five-field contexts folded into one authority key` | `GREEN exit=0 restored runtime invariant passed` |
| F08 | `projection-swap RED exit=1 projection current_report_id disagrees with durable current row` | `GREEN exit=0 restored runtime invariant passed` |
| F09 | `restart-memory RED exit=1 Run lacks exact worker evidence binding: f09-run` | `GREEN exit=0 restored runtime invariant passed`; the fixture closes/reopens the file-backed Kernel before resolution |
| F10 | `stale-profile-boundary RED exit=1 synthetic report boundary is not bound to the supported Director identity` | `GREEN exit=0 restored runtime invariant passed` |
| F11 | `replay-duplicate RED exit=1 current Evaluation publication_report_id disagrees with durable publication` | `GREEN exit=0 restored runtime invariant passed` |
| F12 | `legacy-upgrade-order RED exit=1 legacy same-key rows did not fold deterministically` | `GREEN exit=0 restored runtime invariant passed` |
| F13 | `legacy-upgrade-atomicity RED exit=1 legacy publication row cannot resolve Evaluation: invalid-legacy-row` | `GREEN exit=0 restored runtime invariant passed` |
| F14 | `finalizer-current-history-id RED exit=1 historical Evaluation does not return its own historical Report` | `GREEN exit=0 restored runtime invariant passed`; current/history identity and retry agreement are checked separately |

The same command ended with:

```text
qf g9 authority test: 7 pass, 0 fail, 35 expect
durable projection test: 4 pass, 0 fail, 60 expect
persisted finalizer/gateway test: 6 pass, 0 fail, 102 expect
report-authority: cleanup pid=31196 exit=0 roots_remaining=0
PASS report-authority
```

The process line is an observed child PID and exit code. The root is created,
owned, removed, and checked with `existsSync`; the result is not a hard-coded
zero.

## Focused behavioral and changed-surface receipts

- `bunx tsc --noEmit` in `packages/qf-kernel`: exit 0.
- `bun test src/g9-report-authority.test.ts` in `packages/qf-kernel`: 7 pass, 0 fail, 35 expect calls.
- `bun test src/r15-governed-review.test.ts` in `packages/qf-kernel`: 9 pass, 0 fail, 66 expect calls.
- `bun qa/run.ts governed-review`: 15 pass, 0 fail, 128 expect calls.
- `bun test src/main/research-world.test.ts` in `collab-electron`: 4 pass, 0 fail, 60 expect calls.
- `bun test src/main/ontology-gateway.test.ts` in `collab-electron`: 6 pass, 0 fail, 102 expect calls.
- `bun test src/windows/shell/src/research-world.test.ts` in `collab-electron`: 10 pass, 0 fail, 101 expect calls.
- `bun qa/run.ts kernel-sole-writer-app`: pass.
- `bun qa/run.ts kernel-one-path`: pass.
- `bun qa/run.ts repo-shape`: pass.
- `bun qa/run.ts doc-links`: pass.
- `bun qa/run.ts rung-ladder`: pass.
- `bun qa/run.ts golden-g8-kernel-proof`: pass; Law-B bypasses=0.
- `bun qa/run.ts golden-g8-schema-lifecycle`: pass; exact total=89 and source set exact.
- `git diff --check`: pass; only the existing Git CRLF normalization warning was emitted before commit.

The canonical packaged Report assertion uses the exact top-level key set
`schema`, `source_work`, `source_result`, `publication_evaluation`. It rejects
top-level `authority_context` and verifies that the five-field lineage remains
in the existing durable support metadata. No generic Report guard was relaxed.

## Atlas receipt

After the product candidate was frozen, `bun qf-atlas/generate.mjs` regenerated
the three projections. `bun qf-atlas/generate.mjs --check` reported:

```text
qf-atlas: current — 407 files, 111 channels, 7 strip candidates
```

Compared with delegated parent `314616a16b7ffc84ca4025ed4e958a3db0e1f4d4`,
the generated `diffVsHead` is `better`: `added=0`, `regressed=0`,
`coverageWorse=0`, `unexplained coverage=0`, and 34 prior undecided items were
resolved. The earlier governed-review `indexed → partial` regression is absent.
`bun qf-atlas/ratchet.mjs` reported:

```text
baseline: 3 entries · HARD RED: 0 · unexplained coverage: 0 · undecided w/o blocker: 0 · AMBER (visible, non-blocking): 23 · undecided: 34
```

## Inherited environment and later-order limits

These were observed after the candidate was built and are not relabeled as G9
acceptance:

- `bun qa/run.ts artifact-root` still reaches the inherited `ReferenceError: stripComments is not defined` after its trajectory/refusal receipts.
- Native `bun qa/run.ts research-world-visible` builds successfully, then reaches the unchanged R16 prerequisite `R16 fixture requires a Kernel-owned director-to-executor delegation link`; its observed owned roots are zero.
- Native `bun qa/run.ts hermes-first-turn-synthetic` packages and runs the supported research chain, then reaches the unchanged Kernel falsifier where `findings` expects an array but receives the legacy string form; cleanup reports zero remaining roots.
- G12 Windows/package/operations reds remain outside this order. G8 stayed closed; G10, G11, G12, and R18 were not reopened.

## Hygiene and judgment

- Product candidate parent, SHA, and tree are recorded above; no push, switch, reset, rebase, or shared-history rewrite was used.
- The only product process/root observation claimed by this repair is the bounded `report-authority` cleanup probe; it ended `exit=0` with `roots_remaining=0`.
- No credential, API key, token, secret, or `.env` value was read, written, logged, or templated.

The judgment calls were to leave `collab-electron/src/main/kernel.ts` unchanged
because its existing durable finalizer already satisfied the accepted contract,
to accept the app's late-bound completion event only when the exact durable
source-work relation is present and equal, and to preserve inherited native
build/fixture reds as evidence rather than expanding this G9 repair into G12 or
R16 work. An independent Verifier must decide whether this evidence and
candidate satisfy the order.
