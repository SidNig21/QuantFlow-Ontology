# G9 Builder report

This candidate makes research Reports come only from independently supported research and keeps one current decision for each complete research context while retaining older decisions as explicit history.

## Immutable identities

- Scope: `WO-GOLDEN-G9`
- Checked-out parent authority: `67b01ff63d2fdf33f79447434fe8a3e2d937b1b0`
- Checked-out parent tree: `25379b0564fa70b74c3d3575d260cbfc4d5afad2`
- Requested Reader starting authority retained for reference: `8d78fb714998cc52d50538d6f9ea9a3323f75535`, tree `9af6ae1714c49fc9caa8e59915d0bc88b11a9b35`
- Product candidate: `4ef49077b2b423601c02b043de82b34d231bb7f5`
- Product candidate tree: `bdba7c9540122288866bed6fb4aa57952c6f025e`
- Product commit: `Implement G9 report authority`
- Evidence head: recorded after the receipt-only commit below

The candidate is the immutable product commit. The starting manifest and matrix
were frozen before mutation in the adjacent receipt files. No schema golden,
dependency, G8 behavior, G10–G12 behavior, or R18 authority was changed.

## Delivered bounded surface

- `packages/qf-kernel/src/governed-review.ts` now owns the durable five-field authority context, exact completed-task trajectory binding, one-current partial unique index, predecessor/successor history, preflighted atomic legacy migration, and the sole successful Report publication path.
- `collab-electron/src/main/kernel.ts` no longer keeps a process-local evidence map and its finalizer only resolves durable state, returning the persisted current or historical Report id after Evaluation, gate, and projection agreement.
- `collab-electron/src/main/research-world-projection.ts` projects durable current/history publication rows and markers by the full authority context.
- `packages/qf-kernel/src/g9-report-authority.test.ts` covers one-current supersession, independent contexts, missing worker completion, deterministic partitioned migration, and all-row atomic failure.
- `qa/gates/report-authority.ts` registers the exact F01–F14 fail-capable source falsifiers and focused runtime proofs; `qa/run.ts` registers the gate.
- `qa/gates/hermes-research.ts` and the synthetic executor use the supported `hermes-research-director` identity; the retired `hermes-orchestrator` proof remains a deliberate red bait.
- `qf-atlas/ATLAS.md`, `qf-atlas/atlas.html`, and `qf-atlas/atlas.json` were regenerated after the product edits: 407 files, 111 channels, 7 strip candidates.

## Candidate path hashes

SHA-256 hashes below are the committed candidate file bytes.

| path | SHA-256 |
| --- | --- |
| `collab-electron/src/main/governed-review.test.ts` | `02412bc80925d1f55f1588696666607854b35cab1639d9dbceb3e48571d08ea0` |
| `collab-electron/src/main/index.ts` | `67dbf6f8d697c671d893e0d8f72e2ce39d69b5dbf032ac5e22c01a68f3c9a431` |
| `collab-electron/src/main/kernel.ts` | `b02b7040b37b71bbd4cc89ce7c9ca90aa6443da4c4b4404dcef6cf138d080e46` |
| `collab-electron/src/main/ontology-gateway.test.ts` | `9788c58d56d377e67844dc213681fbd99caf5d348eddcce4881e452ea0ff7551` |
| `collab-electron/src/main/research-world-projection.ts` | `95a6db85179b6687d655fb979d47242c1210cee886d06a75fd42212f5fe6a72e` |
| `collab-electron/src/main/research-world.test.ts` | `506ef20296c5f32fed85c2dfac82978283858c64c95f8d7d58024ac220f26909` |
| `packages/qf-kernel/src/attach-kernel-drift.test.ts` | `6125a8177a6bd677275b6c964c5b297c1856ed65231178853ea28577bb169da2` |
| `packages/qf-kernel/src/g9-report-authority.test.ts` | `70c2c7030bc36701597bd1e69ee4c51c082d6cf74555a9daa376b50d5d555177` |
| `packages/qf-kernel/src/governed-review.ts` | `1880c70414d2655d5daff7a42e86ed07963331bb87c3a3ec8ff0f16f35256284` |
| `packages/qf-kernel/src/index.ts` | `e51382dfe6eadda5a6969fdd11de227cb64734e64e8b9c04fe9d3cee86736cda` |
| `packages/qf-kernel/src/portable.ts` | `e5bfa150c87b7e7d08e888a7745917112bdf650f273e499c1ea461f666ca12cb` |
| `packages/qf-kernel/src/r12-independent-critic.test.ts` | `be7bb0f617fda94d26409556891a7fc3f68f17bfffd31b0b9d6c94f5d38db8bc` |
| `packages/qf-kernel/src/r15-governed-review.test.ts` | `bfa59aa45d66756660f01ba7bdebc310bdac3c0530618cb1a62d977cb0d1ef6d` |
| `qa/gates/hermes-research.ts` | `abaa1f644efc58907635f7f1d28affbbf452850b44645278919ad66c8fa7da23` |
| `qa/gates/report-authority.ts` | `d1d5daa5e4e33740ff2353f314c4d06fa9533200561e9f2c1da28bc8d12cbe9c` |
| `qa/run.ts` | `1c69ee70b75244f129d1155a46a03174d0df26bd36287ef75521c1c5e1b1cd1d` |
| `qf-atlas/ATLAS.md` | `92c725e043f3081ee1e2ff309600f051c451fd74f483803eefd49816993ce285` |
| `qf-atlas/atlas.html` | `fc7accab9515b2edc7fad83d22f97491586c8619199fae25b1faad61d6d4cb34` |
| `qf-atlas/atlas.json` | `c86b0e5a3e97d8e2681871abac2425cb4993a5d479b0076772846e50b8e981d4` |

## F01–F14 falsifier receipt

Command: `bun qa/run.ts report-authority` at the candidate. Every deliberate
break exited 1 and every restored control exited 0.

| id | red receipt | restored green receipt |
| --- | --- | --- |
| F01 | `ordinary-report-relabel RED exit=1 ... missing=kind: "trajectory"` | `GREEN exit=0 ordinary trajectory writer remains trajectory` |
| F02 | `duplicate-publisher RED exit=1 finalizer has no Report write transition` | `GREEN exit=0 finalizer has no Report write transition` |
| F03 | `lineage-bypass RED exit=1 ... missing=criticIsAdmitted` | `GREEN exit=0 independent critic, findings, and frozen source-work guards remain` |
| F04 | `worker-evidence-cardinality RED exit=1 ... missing=candidates.length !== 1` | `GREEN exit=0 exact completed-task candidate/cardinality resolver remains` |
| F05 | `current-uniqueness RED exit=1 ... missing=CREATE UNIQUE INDEX qf_review_publication_current_authority` | `GREEN exit=0 one-current partial unique index remains` |
| F06 | `supersession-loss RED exit=1 ... missing=superseded_by_source_work_key` | `GREEN exit=0 explicit predecessor/successor history remains` |
| F07 | `context-crossing RED exit=1 ... missing=context.strategy_id` | `GREEN exit=0 complete five-field authority key remains` |
| F08 | `projection-swap RED exit=1 ... missing=row.is_current === 1` | `GREEN exit=0 projection selects durable current/history markers` |
| F09 | `restart-memory RED exit=1 finalization resolves durable worker evidence and has no volatile map authority` | `GREEN exit=0 finalization resolves durable worker evidence and has no volatile map authority` |
| F10 | `stale-profile-boundary RED exit=1 synthetic report boundary uses current Director identity` | `GREEN exit=0 synthetic report boundary uses current Director identity` |
| F11 | `replay-duplicate RED exit=1 ... missing=existingPublication` | `GREEN exit=0 replay reuses durable publication and gate identity` |
| F12 | `legacy-upgrade-order RED exit=1 ... missing=const partitions = new Map` | `GREEN exit=0 legacy migration partitions and applies deterministic stable-ID order` |
| F13 | `legacy-upgrade-atomicity RED exit=1 legacy rows preflight completely before atomic migration begins` | `GREEN exit=0 legacy rows preflight completely before atomic migration begins` |
| F14 | `finalizer-current-history-id RED exit=1 ... missing=publication.is_current === 1` | `GREEN exit=0 finalizer returns persisted current or historical publication identity` |

Runtime proof from the same command:

- G9 Kernel authority test: 4 pass, 0 fail, 20 expect calls.
- Durable projection test: 4 pass, 0 fail, 60 expect calls.
- Persisted finalizer/gateway test: 6 pass, 0 fail, 102 expect calls.
- `report-authority: owned_processes_remaining=0 roots_remaining=0`.
- `PASS report-authority`.

## Changed-surface and matrix receipts

The frozen pre-mutation rows 1–19, including exact commands and outputs, are
in `BUILDER-STARTING-MATRIX.md`. The post-edit changed-surface receipts were:

- `bun test src/g9-report-authority.test.ts`: 4 pass, 0 fail, 20 expect calls.
- `bun test src/r12-independent-critic.test.ts src/r15-governed-review.test.ts src/attach-kernel-drift.test.ts` in `packages/qf-kernel`: 23 pass, 0 fail, 122 expect calls.
- `bun test src/main/governed-review.test.ts` in `collab-electron`: 5 pass, 0 fail, 21 expect calls.
- `bun test src/main/research-world.test.ts` in `collab-electron`: 4 pass, 0 fail, 60 expect calls.
- `bun test src/windows/shell/src/research-world.test.ts` in `collab-electron`: 10 pass, 0 fail, 101 expect calls.
- `bun run typecheck` in `packages/qf-kernel`: exit 0.
- `bun qa/run.ts governed-review`: PASS; 15 pass, 0 fail, 128 expect calls across the focused production/kernel proof.
- `bun qf-atlas/generate.mjs --check`: `qf-atlas: current — 407 files, 111 channels, 7 strip candidates`.
- `bun qf-atlas/ratchet.mjs`: baseline 3 entries, HARD RED 0, unexplained coverage 0, undecided without blocker 0.
- `git diff --check`: exit 0; only Git’s CRLF normalization warnings were emitted.

The frozen matrix also records these inherited/environment reds exactly:

- `bun qa/run.ts artifact-root`: trajectory/report refusal receipts passed, then existing `ReferenceError: stripComments is not defined`.
- Combined `collab-electron` governed-review plus ontology-gateway tests: 6 pass, 1 fail, 1 error, existing Electron `Export named 'BrowserWindow' not found`.
- `bun qa/run.ts hermes-first-turn-synthetic`: falsifier receipts passed, then the existing Electron bundle failed with `Cannot read directory "../..": Access is denied`; cleanup reported `roots_remaining=0`.
- `bun qa/run.ts research-world-visible`: stopped before launch with existing `candidate build exited 1`.

The G12-owned Windows/package/operations reds remain outside this G9 order and
are not relabeled as G9 acceptance. The inherited retired-profile proof was
resolved in the bounded source surface to `hermes-research-director`, and F10
records the retired `hermes-orchestrator` red/restored-green bait. The full
packaged stale-profile assertion was not reached because the inherited Windows
build red above occurs first. G8 remained closed; G10, G11, G12, and R18 were
not reopened.

## Hygiene and judgment

- Final G9 gate roots: zero.
- Exact bounded process census: `{"processes":0,"owned_roots":0,"error":"Access denied "}`; WMI denied enumeration, so this is not a Windows product qualification.
- Final worktree: expected to be clean after the receipt-only commit; no push, switch, reset, rebase, or shared-history rewrite was used.
- No credentials were read, written, logged, or templated.

The only judgment call was preserving the explicitly delegated checked-out
parent `67b01ff...` while retaining the order’s Reader authority `8d78fb...` as
reference, because the user’s delegation named the former as the actual clean
authority. The inherited build reds were preserved as evidence rather than
masked or fixed, because G12/package repair is outside this order.
