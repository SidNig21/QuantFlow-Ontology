# WO-GOLDEN-PHASE3 — whole-product Golden requalification

status: **PREPARED / FRESH SEMANTIC READER REQUIRED / BUILDER CLOSED**
depends: G1–G12 independently accepted; G12 candidate `d14ceb36659d86f157b4856b927581616dbaaa56`

## Objective

Requalify the complete remaining supported repository and current Windows product from the purified Phase-2 source, freeze one immutable candidate, obtain one independent Verifier PASS, and only then designate the Golden SHA.

## In plain terms

Prove from a clean start that the whole product Ryan has today is intentional, installs and runs on Windows, tells the same truth on screen as in its durable record, completes a real research journey, survives reopening, and shuts down cleanly.

## Authority and starting identity

- purified source candidate: `d14ceb36659d86f157b4856b927581616dbaaa56`
- purified source tree: `b84d4641a5f37e76c3e62a7df54d8019e0869ffe`
- purified source sole parent: `200d45a92fbef4238b65436f2695b50e54434199`
- G12 independent Verifier: task `01a051b0-75f7-7272-954b-b52d8c64bc20`
- G12/Phase-2 closure: [immutable acceptance](evidence/golden-baseline/g12/VERIFIER-ACCEPTANCE-20260830.md)

Read `START_HERE.md`, `docs/orders/NEXT.md`, this order, `docs/orders/PROTOCOL.md`, ADR-0004, `docs/orders/GOLDEN-RUN.md`, `qf-atlas/ATLAS.md`, and every Phase-3 TSV in full. The exact authority commit containing this packet must receive a fresh semantic Reader YES / YES before a Builder exists.

## One meaning

Phase 3 is whole-repository/current-product requalification, not a thirteenth purification group and not R18. Accepted G1–G12 are inherited and remain byte-immutable. Do not deeply rerun a prior group merely for ceremony; reuse its exact-SHA receipt unless Phase-3 composition directly exercises that boundary. Phase 3 must nevertheless account for every current file, dependency, package hook, operational root, current claim, gate, and supported consumer path as one product.

## Deliverables

1. A mechanically generated current census that accounts for 100% of tracked files, direct dependency declarations, Electron package declarations/hooks, operational roots, generated resources, and registered gates. Reconcile every change from the Phase-1 provenance (`1,150`, `153`, `19`, `40`) through accepted G1–G12 dispositions; historical counts are provenance, never the current denominator.
2. A complete disposition proving zero unexplained production, package, compatibility, future-route, authority, or test defects. “Known,” “legacy,” skipped, unreachable, or future-useful is not an explanation without an accepted disposition.
3. Clean frozen install, build, package, installer, first launch, normal shutdown, and relaunch from the purified source on native Windows x64. Ambient installs, caches, or previously built product bytes may not substitute for this proof.
4. Honest composition of every current registered gate and test. Each current product claim has a fail-capable owner; no wrapper-only green, mock/fixture presented as live capability, weakened assertion, dead falsifier, silent skip, or duplicate authority counts.
5. A naive Windows app traversal of the supported current consumer surface. Every visible state/claim must agree with read-only Kernel truth; projections may not remember durable truth.
6. One real current bounded research journey through the Research Director: durable Mission, exact specialist sessions, assigned Tasks, cited evidence, versioned Strategy/Technique where available, Dataset/Run/Artifact lineage, independent Evaluation, and Report or explicit no-candidate result, with an explicit statement that no bet or trade was placed. Exercise one accepted steering control and one refused invalid control.
7. Close the application and reopen it against the same canonical Kernel. Prove the Mission, sessions, Tasks, evidence, Evaluation, result, and steering history remain visible and agree with Kernel truth.
8. Normal final shutdown with `processes=0`, `roots_remaining=0`, and `leaked=[]`.
9. Exact Atlas, law, gate, command, output-hash, duration, candidate/tree/parent, changed-path, and cleanup receipts. Atlas must be generated-current, pass its check and ratchet, and report HARD RED 0.
10. One immutable Phase-3 candidate followed by one fresh independent Verifier. Only a later evidence-only Router rotation after that PASS may name the Golden SHA.

The exact matrix is [`PHASE3-STARTING-MATRIX.tsv`](evidence/golden-baseline/phase3/PHASE3-STARTING-MATRIX.tsv). The exact scope/disposition map is [`PHASE3-SURFACE-MANIFEST.tsv`](evidence/golden-baseline/phase3/PHASE3-SURFACE-MANIFEST.tsv). The finite denominator and output schemas are [`PHASE3-CENSUS-SCHEMA.tsv`](evidence/golden-baseline/phase3/PHASE3-CENSUS-SCHEMA.tsv) and [`PHASE3-WINDOWS-TRAVERSAL.tsv`](evidence/golden-baseline/phase3/PHASE3-WINDOWS-TRAVERSAL.tsv).

## Finite accounting contract — P05, P06, P08, P12

Reader authority SHA `746d29a0` freezes the seed outputs, counts, and SHA-256 values in [`PHASE3-SEED-HASHES.tsv`](evidence/golden-baseline/phase3/PHASE3-SEED-HASHES.tsv): **1,440 tracked files, 20 exact-leaf `package.json` manifests, 103 direct-dependency rows, 6 Electron build/package hook scripts, 15 exact-leaf `bun.lock` roots, 122 tracked test/spec files, and 72 registered gates**. The Census TSV defines exact PowerShell extractors, grammars, bounded constructs, normalization, and output paths. `agentos-package.json` is a packaged resource, not a package manifest. Historical Phase-1 totals remain provenance.

The Builder may add only `qa/gates/golden-phase3-requalification.ts`, its `qa/run.ts` registration, and Phase-3 evidence under the manifest. That prepared gate must mechanically emit:

- `tracked-files.tsv`, `direct-dependencies.tsv`, `package-hooks.tsv`, `package-lock-roots.tsv`, `packaged-generated-resources.tsv`, `tests.tsv`, `gates.tsv`, `claims.tsv`, and `supported-consumers.tsv`, one stable sorted row per item;
- `dispositions.tsv`, exactly one row for every item in those ledgers with `current-production`, `package`, `compatibility`, `authority/evidence`, `test/proof`, or `retired-by-accepted-Gn` disposition plus exact evidence;
- `claim-proof-map.tsv`, exactly one row per current claim with its supported consumer, test/gate, named falsifier selector and expected RED, live-versus-fixture tier, and Kernel oracle where visible;
- `completeness.txt`, which is PASS only when every ledger key occurs exactly once in dispositions, every current claim has at least one fail-capable proof/falsifier, no unknown extra row exists, and recomputed totals equal the frozen starting census plus the enumerated Phase-3 proof-only delta.

Falsifiers must delete one ledger row, duplicate one disposition, remove one claim mapping, point one claim at a fixture-only proof, and add one unregistered gate. Each must RED. P06 is satisfied only by zero blank, `unknown`, `legacy`, `future`, `unreachable`, or unsupported dispositions.

Every registered gate is classified in [`PHASE3-GATE-CLASSIFICATION.tsv`](evidence/golden-baseline/phase3/PHASE3-GATE-CLASSIFICATION.tsv) as `CURRENT_HEAD` or `HISTORICAL_EXACT_SHA`; set equality with the 72-row Reader-authority `bun qa/run.ts --list` output plus the single enumerated Phase-3 registration delta is mandatory. `golden-g11-authority` is permanently `HISTORICAL_EXACT_SHA` at accepted G11 candidate `1f81c469371fbb4db3e4e8bdac1248f0a0d3d51c`; it is never rewritten to bless current authority. A historical gate runs from a fresh isolated `git archive` of its recorded SHA, records archive/output hashes, and reconciles the current gate name, description, registration bytes, implementation-path bytes, and accepted receipt to that historical identity. Running it from any other SHA must RED with `wrong-historical-authority`. All other starting gates are `CURRENT_HEAD` and run from the immutable Phase-3 execution source.

## Non-circular execution source and isolated Windows run — P09 and P10

After Reader YES / YES, the Builder may commit only the authorized Phase-3 gate implementation, its one `qa/run.ts` registration, and no receipt. That clean commit is `PHASE3_EXECUTION_SOURCE_SHA`; its receipt freezes SHA, tree, sole parent (the exact Reader-authority commit), and enumerated delta. P09–P17 run only from a fresh `git archive PHASE3_EXECUTION_SOURCE_SHA`, never from an uncommitted tree or later candidate. Before execution, byte equality against purified source `d14ceb...` is mandatory for every product, package, test other than the one new gate, existing gate, config, and generated-runtime input; the only non-equal bytes are the two Reader-authorized gate/registration paths and authority/evidence ancestors.

All cold work occurs in a new run-scoped directory outside the shared checkout and records archive SHA-256 plus execution-source SHA/tree/sole-parent. It must use a new empty Bun cache/install cache and may use only committed lockfiles with frozen installs. It must not delete, modify, or reuse shared-checkout `node_modules`, build output, package output, database, profile, or cache.

The receipt records the exact commands: frozen installs for every lock root through the canonical `bun qa/verify-release.ts` orchestration; `bun run build`, `bun run package:unsigned`, `bun qa/run.ts windows-cold-boot`, `bun qa/run.ts windows-installer`, and the canonical verifier from the isolated source. The run receives unique absolute `QF_KERNEL_DB`, temp, user-data, artifact, profile, package-output, install, and receipt roots. Before launch and after final shutdown, record PID/parent/name/command-line censuses. Cleanup may remove only roots created and ownership-marked by this run after proving their resolved paths lie beneath the run root. Any pre-existing or unowned process/root is observed, never killed or deleted. Final owned counts are zero.

## Exact Windows consumer and research traversal — P13 through P16

[`PHASE3-WINDOWS-TRAVERSAL.tsv`](evidence/golden-baseline/phase3/PHASE3-WINDOWS-TRAVERSAL.tsv) is the checklist. It covers Research Director admission, Mission canvas/card and inspect view, Dock inventory and specialist tiles, Task plan/assignment/status/steering history, Dataset/Run/Artifact/Evaluation/Report lineage, current-versus-history state, close, reopen, and normal shutdown. Every visible claim is transcribed and compared to a read-only query through the generated Kernel read surface against the same isolated DB; direct UI writes or a second oracle are forbidden.

The bounded market is exactly one `market_event`, its related `instrument`, and the point-in-time `quote` rows admitted to one Dataset. Before admission the operator selects a Technique with stable object ID, semantic version, and content hash. If any is absent, the only accepted branch is a visible coverage refusal that creates no fabricated Dataset/Run/Artifact/Evaluation/Report and preserves the durable Mission/refusal receipt. A successful-research PASS requires real current data evidence (source identity, observed/source timestamps and admitted IDs) and a real model turn (session/turn identity and artifact bytes/hash); fixtures or synthetic model output are never sufficient.

Cardinality is derived deterministically from the Kernel after settle: one active Mission for the run-scoped mission key; the exact selected Technique; the exact admitted market graph; exact assigned specialist session IDs; all Tasks reachable from the Mission; all worker evidence linked to their producing sessions; exactly one selected terminal Evaluation and at most one current Report chosen by the accepted current-authority key. Unexpected extra objects or links RED rather than being filtered.

Named falsifiers are: `ui-kernel-mismatch`, `steering-ui-only`, `persistence-drop`, `fixture-as-live`, `missing-technique-identity`, `fabricated-coverage`, `extra-lineage-object`, and `wrong-current-report`. The first four are mandatory Verifier reruns. Successful research and permitted coverage refusal are separate receipt outcomes; refusal proves only the refusal path and cannot close the successful live-research requirement.

## Candidate, Verifier, rollback, and Golden chain — P18 through P20

Allowed Phase-3 mutation is limited to the two prepared gate-registration paths named above and `docs/orders/evidence/golden-baseline/phase3/**`. After P09–P17, the Builder commits only the already-complete P01–P17 receipts as the sole child of `PHASE3_EXECUTION_SOURCE_SHA`; that commit is the immutable Phase-3 candidate. Its delta is exactly those enumerated receipts. Product/package/test/existing-gate/config/generated-runtime bytes equal the execution source byte-for-byte, and accepted `g1/**` through `g12/**` evidence equals purified source byte-for-byte. No receipt inside the candidate may name or predict the candidate's own SHA, tree, parent, commit time, or freeze time. No edit follows freeze.

The fresh Verifier first resolves the candidate from Git and records its exact SHA, tree, sole parent, commit timestamp, independent freeze-observation timestamp, clean status, complete tree delta, and candidate-versus-execution-source equality in the Verifier acceptance, which necessarily exists outside the candidate. It then archives either the candidate (whose executable bytes are proven equal) or `PHASE3_EXECUTION_SOURCE_SHA`, records which, and runs the complete P01–P19 matrix, all completeness falsifiers, `wrong-historical-authority`, the four mandatory Windows falsifiers, clean package lifecycle, canonical verifier, live research, close/reopen, and cleanup. It never runs from a dirty tree and does not edit, regenerate candidate bytes, kill unowned processes, or repair a red.

Rollback exists only inside the isolated execution root and deletes only ownership-marked run-created files after path confinement proof. It never rewrites the candidate, shared checkout, accepted evidence, `main`, or any remote ref.

After Verifier PASS, Golden designation is one receipt-only descendant whose sole parent is the exact passed candidate. Its tree delta is enumerated and limited to the Verifier acceptance, Golden designation receipt, and `NEXT.md` closure text; it may contain no product/test/gate/config change. `main`, remotes, and R18 remain untouched. R18 stays frozen until a separate later `NEXT.md` rotation.

## Execution and stop conditions

Freeze P01–P08 before mutation. Run fast static/focused checks before expensive clean-source and packaged traversal, but execute P09–P17 once in full on the final product bytes. Independent read-only commands may run concurrently only when they cannot mutate shared state.

Stop immediately and return the smallest exact route when any of these occurs:

- the authority SHA/tree/parent, G12 closure identity, or clean starting state differs;
- any current item cannot be accounted for or any defect remains unexplained;
- a product, semantic authority, supported-platform, compatibility, scope, or acceptance-meaning change is required;
- any existing test/gate must be weakened, deleted, skipped, or reinterpreted to pass;
- a new dependency, service, credential, network update, signing path, trade/bet execution, R18 capability, or unsupported platform would be required;
- clean install/build/package, canonical release, UI↔Kernel agreement, live research, persistence, Atlas/law, or cleanup is red;
- evidence cannot distinguish live capability from fixture/mock proof;
- any non-receipt byte changes after the candidate is frozen.

A red is not permission to repair. The Builder freezes the evidence and stops. The Router may make a same-meaning receipt/isolation/invocation correction only after proving it is purely mechanical under ADR-0004; every product or semantic red requires a separately bounded authority amendment and fresh Reader before editing.

## Rollback

Before any authorized repair, record the exact authority HEAD/tree and changed-path manifest. Rollback is the ordinary inverse of only the separately authorized Phase-3 change, restoring the purified source behavior and configuration without rewriting shared history, deleting evidence, changing accepted G1–G12 bytes, or touching `main`. Re-run the focused falsifier and the matrix rows affected by that inverse. If exact restoration is not possible, stop; do not improvise a second baseline.

## Acceptance and handoff

The Builder reports evidence, never PASS: the Git-resolved candidate SHA/tree/sole parent in the external handoff message (not a candidate-contained receipt), full changed-path manifest, each P01–P17 result and receipt path/hash, red/green bait transcripts for any new or changed gate, current accounting totals, Atlas HARD RED count, UI↔Kernel comparison, research lineage IDs, close/reopen proof, and final process/root counts. The worktree must be clean. The independent Verifier owns the durable P18 identity/freeze record.

A fresh independent Verifier repeats the mandatory matrix and falsifiers under P19. If and only if it returns PASS on the immutable candidate, the Router may write the strictly bounded receipt-only descendant under P20. Phase 3 does not open R18; `NEXT.md` must be separately rotated after Golden closure.

## Reader brief — exactly two questions

1. Can every Phase-3 deliverable and matrix row actually fail, including full accounting, clean-source package lifecycle, honest gate composition, UI↔Kernel agreement, live research, persistence, cleanup, and independence?
2. Does this packet have exactly one meaning—complete current Windows product requalification from the immutable purified source, inheriting rather than ceremonially rerunning G1–G12, with any repair stopped and separately routed before one final candidate, independent Verifier, and Golden SHA?

The Reader returns `YES / YES` or a finite defect list against the exact authority commit. No Builder creation, product/test/gate edit, Phase-3 execution, Golden designation, or R18 work is authorized before YES / YES.
