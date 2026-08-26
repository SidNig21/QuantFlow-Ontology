# WO-GOLDEN-G3 — Retire peer-bus and critic-mock package islands

status: **READER ROUND 1 NO/NO — AMENDED FOR FINAL RE-READ**
order-type: Golden Baseline Phase 2 non-rung group
branch: `wo-golden-g2`
founder-approved-route: G3 — peer-bus and critic-mock islands
parent-group: G2 **CLOSED / ACCEPTED** at `1ae84771d043c77bebaece4f886096c8cae5b981`
round-1-reader-task: `01a03c4f-47ab-7f50-82ca-c7b87a676ca1`
r18-authority: **FROZEN**
main-authority: **NONE**
builder-authority: **NONE UNTIL FINAL READER YES/YES + NEXT.md ROTATION**

## Outcome and one meaning

G3 removes two obsolete standalone package islands:

- `tools/qf-peer-bus/**`;
- `species/critic-mock/**`.

It retains the current app-owned notification transport and the current governed critic path. “One collaboration truth path” means Kernel Task, Artifact, Evaluation, and Report objects remain authoritative while `collab-electron/src/main/kernel.ts` app-owned notifications flow through `peer-delivery.ts` to Agent Host/native TUI. Transport rows are delivery state, never domain truth.

A “consumer” is an executable import, spawn/launch route, Dock inventory entry, package/build resource, supported predecessor-state requirement, current authority requirement, or explicit R18–R25 dependency. QA, generated output, history, filename strings, and comments are classified separately and do not count as production consumers.

## Preserved current boundary

G3 may not remove, disable, rename, or semantically relabel:

- app-owned `QF_PEER_BUS_DB`, `.qf-peer-bus` compatibility directory, transport schema, or migration behavior;
- `collab-electron/src/main/kernel.ts` notification transport;
- `collab-electron/src/main/peer-delivery.ts`;
- `collab-electron/src/main/index.ts`, `agent-host.ts`, `host-native-tui.ts`, or `sidecar/server.ts` collaboration seams;
- current Dock collaboration and Windows/WSL forwarding;
- `hermes-critic`, Kernel independent-critic tests, or governed-review implementation/tests;
- shared MCP, ACP, AgentOS, AI, Zod, or `qf-kernel` dependencies used elsewhere.

G4 owns AgentOS, G5 owns ACP/Agent Chat/Terminal, and G7 owns broader dependency contraction.

## Exact tracked deletion manifest

The Builder must verify exact bytes at `BUILD_BASE_SHA`, then delete all and only:

1. `tools/qf-peer-bus/.gitignore`
2. `tools/qf-peer-bus/README.md`
3. `tools/qf-peer-bus/bun.lock`
4. `tools/qf-peer-bus/package.json`
5. `tools/qf-peer-bus/tsconfig.json`
6. `tools/qf-peer-bus/scripts/setup-founder-seats.ts`
7. `tools/qf-peer-bus/src/bus.ts`
8. `tools/qf-peer-bus/src/harness.ts`
9. `tools/qf-peer-bus/src/server.ts`
10. `species/critic-mock/.gitignore`
11. `species/critic-mock/README.md`
12. `species/critic-mock/agent-package/agentos-package.json`
13. `species/critic-mock/agent-package/package.json`
14. `species/critic-mock/agent-package/src/acp-main.ts`
15. `species/critic-mock/bun.lock`
16. `species/critic-mock/evidence/dock.png`
17. `species/critic-mock/package.json`
18. `species/critic-mock/register.ts`
19. `species/critic-mock/scripts/pack-agent.mjs`

After tracked deletion, remove ignored/generated descendants under these two exact roots, including present `tools/qf-peer-bus/node_modules`, then remove the empty roots. No wildcard or parent deletion is allowed. Record every literal removed path and prove both exact roots absent.

Only the two package-local locks/manifests and dependencies leave. A shared root/app dependency may change only if the G3 census proves no surviving declaration/consumer and the Reader explicitly names it; otherwise G7 owns it.

## Deliverable A — Frozen purpose and consumer census

Before mutation create `docs/orders/evidence/golden-baseline/g3/BEFORE.md` with:

- clean `BUILD_BASE_SHA`, branch/upstream, product-process count zero;
- path/bytes/SHA-256 for all 19 tracked targets;
- ignored-descendant manifest for both roots;
- exact import, spawn, runtime inventory, Dock manifest, Electron `extraResources`, package ref, build output, installer, compatibility/state, QA, current authority, history, generated, comment/string, and R18–R25 references;
- package-local and surviving shared dependency declarations;
- exact starting matrix results and all pre-existing reds;
- Atlas 432-file/126-channel/13-strip-candidate starting baseline and clean-tree hash.

Search universe is every tracked file plus package/build/update/runtime resolution inputs and ignored descendants under the two roots. Exclude `.git`, external `node_modules` except the named in-root residue, disposable temp roots, caches, and generated build output except for a literal target-name absence scan.

Add `qa/gates/golden-g3-consumer-census.ts` and register `golden-g3-consumer-census` in `qa/run.ts`. It must enumerate the consumer classes above, reject either obsolete root in every production/package/compatibility/future-rung class, permit named QA/history/generated/comment occurrences only when listed in `BEFORE.md`, and assert the preserved app-owned seams remain present. It has a non-writing selector `QF_G3_CONSUMER_CENSUS_FALSIFY=peer-bus|critic-mock` that injects one virtual forbidden production consumer. Each selector exits 1 naming the injected root/class; unset exits 0. No new product truth or runtime code.

Because neither target is a current package input, G3 requires this explicit package-boundary census and Electron build, not a full installer/release traversal.

## Deliverable B — Dedicated lifecycle-command fixture

The generic recursive-install lifecycle invariant remains current but may not depend on an obsolete package.

Add exact QA-only fixture root `qa/fixtures/lifecycle-command/` containing:

- `package.json`: private package, `scripts.typecheck = "tsc --noEmit"`, only `devDependencies.typescript = "5.9.3"`;
- empty `tsconfig.json`;
- committed frozen `bun.lock`.

In `qa/run.ts`, replace only the obsolete `PEER_BUS_DIR` lifecycle target with this fixture, rename the constant to `LIFECYCLE_FIXTURE_DIR`, and keep discovery/matcher behavior unchanged. Preserve all allowed/rejected controls and selectors `literal`, `flagged`, and `chained`.

For each selector, `bun qa/run.ts typecheck` must exit 1 with `typecheck: forbidden lifecycle` and name the fixture. With the selector unset it exits 0. Unknown selector behavior remains fail-closed.

## Deliverable C — Current law gates remain falsifiable

### Kernel one path

Remove the obsolete `tools/qf-peer-bus/src/harness.ts` allowlist entry.

Add a self-cleaning `QF_KERNEL_ONE_PATH_FALSIFY=1` bait under exact QA temp path `tools/_qf-k1-path-bait/falsify.ts` containing an unauthorized `process.env.QF_KERNEL_DB` read and `kernel.db` literal. The falsifier run exits 1 naming the bait. A `finally`/signal-safe cleanup removes the exact bait root. The unset run exits 0 and the tree is byte-identical.

### Kernel sole writer

Remove only allowlist rows for deleted G3 files. Preserve all other Law E classifications and use the gate’s existing self-cleaning selectors:

- `QF_KERNEL_SOLE_WRITER_FALSIFY_OPEN=1`;
- `QF_KERNEL_SOLE_WRITER_FALSIFY_WRITE=1`.

Each exits 1 naming its bait; normal `kernel-sole-writer` and `kernel-sole-writer-app` runs exit 0.

No allowlist change may exempt a new product path.

## Deliverable D — Atlas remains honest

Remove only the standalone peer-bus special classifier/transport rows from `qf-atlas/classify.mjs`. Preserve app `peer-delivery.ts` and Kernel transport classification.

Retarget falsifier 18 from the deleted island to a purpose-built temporary coverage bait that creates a real unresolved/coverage-limited example, proves the generated coverage brief names it, then restores exact bytes in `finally` and signal cleanup. Do not use `peer-delivery.ts` unless it genuinely has the named coverage gap. Update `qf-atlas/markdown.mjs` wording from the obsolete package to the temporary coverage example.

Regenerate `atlas.json`, `ATLAS.md`, and `atlas.html` only after the product/QA candidate is committed clean. Require check, all falsifiers, ratchet HARD RED 0, and before/after tree hash equality for non-generating proof runs.

## Deliverable E — Current docs and identity

Update current claims in `README.md`, `species/hermes/README.md`, `docs/DOCTRINE.md`, and `docs/RESEARCH.md` so they name the app-owned peer notification transport rather than the deleted MCP package. Correct the stale top comment in `peer-delivery.ts` without changing behavior.

Current critic identity is `hermes-critic`, never `critic-mock`. Remove obsolete critic-mock product-identity/allowlist references only after the consumer census proves absence.

Historical receipts, including `docs/DEBT.md` and accepted evidence, remain byte-preserved unless they falsely claim current authority. A short annotation may mark an old claim historical; do not rewrite accepted history.

## Command-exact starting and candidate matrix

All commands run from repository root in PowerShell. Record command, UTC start/end, exit, log SHA-256, pre/post HEAD, and pre/post status. Falsifier failures are expected exit 1 and must restore the clean starting tree.

| # | Exact command | Expected |
|---:|---|---|
| 1 | `git status --porcelain=v1; git rev-parse HEAD; git rev-parse origin/wo-golden-g2` | empty status; three SHAs equal at start |
| 2 | for each `literal,flagged,chained`: set `QF_TYPECHECK_FALSIFY_RECURSIVE_INSTALL`, run `bun qa/run.ts typecheck`, unset | each exit 1, names forbidden lifecycle; tree clean |
| 3 | `bun qa/run.ts typecheck` | exit 0 |
| 4 | set `QF_KERNEL_ONE_PATH_FALSIFY=1`; `bun qa/run.ts kernel-one-path`; unset | exit 1 naming bait; bait absent/tree clean |
| 5 | `bun qa/run.ts kernel-one-path` | exit 0 |
| 6 | set `QF_KERNEL_SOLE_WRITER_FALSIFY_OPEN=1`; `bun qa/run.ts kernel-sole-writer`; unset | exit 1 naming open bait; tree clean |
| 7 | set `QF_KERNEL_SOLE_WRITER_FALSIFY_WRITE=1`; `bun qa/run.ts kernel-sole-writer`; unset | exit 1 naming write bait; tree clean |
| 8 | `bun qa/run.ts kernel-sole-writer; bun qa/run.ts kernel-sole-writer-app` | both exit 0 |
| 9 | for each `peer-bus,critic-mock`: set `QF_G3_CONSUMER_CENSUS_FALSIFY`, run `bun qa/run.ts golden-g3-consumer-census`, unset | each exit 1 naming root/class; tree clean |
| 10 | `bun qa/run.ts golden-g3-consumer-census` | exit 0 |
| 11 | `bun test packages/qf-kernel/src/r12-independent-critic.test.ts packages/qf-kernel/src/r15-governed-review.test.ts collab-electron/src/main/governed-review.test.ts` | exit 0 |
| 12 | `bun qa/run.ts governed-review; bun qa/run.ts governed-review-live` | both exit 0 |
| 13 | `bun qa/run.ts windows-dock-collaboration` | exit 0; isolated transport/task/ACK and cleanup |
| 14 | `bun qa/run.ts dock-production-inventory; bun qa/run.ts product-identity` | both exit 0; no mock inventory |
| 15 | `bun test collab-electron/scripts/package-lib/shared-paths.test.ts` | exit 0 |
| 16 | `bun install --frozen-lockfile --ignore-scripts; bun run build` in `collab-electron` using the repository’s existing frozen-install helper where the gate already supplies one | both exit 0; no lifecycle scripts |
| 17 | `bun qa/run.ts repo-shape; bun qa/run.ts doc-links; bun qa/run.ts rung-ladder` | all exit 0 |
| 18 | `bun qf-atlas/generate.mjs --check` | exit 0/current |
| 19 | `bun qf-atlas/falsify.mjs` | all falsifiers PASS; pre/post HEAD/status/tree equal |
| 20 | `bun qf-atlas/ratchet.mjs` | exit 0; HARD RED 0 |
| 21 | literal PowerShell checks for absence of all 19 targets, both roots, ignored descendants, and target strings in built output | zero remaining |
| 22 | `git diff --check BUILD_BASE_SHA...HEAD; git diff --check` | both exit 0 |
| 23 | exact QuantFlow/Electron/Bun/Hermes/WSL process census and G3-created temp-root census | process_count=0; roots_remaining=0; leaked=[] |
| 24 | `git status --porcelain=v1; git rev-parse HEAD` | clean immutable candidate SHA |

On the frozen starting SHA, commands 2, 4, and 9 may be unavailable until their G3 falsifier is implemented; record that as `not-yet-implemented`, not green. All existing commands run before mutation. Any other starting red is classified before the Builder opens.

## Evidence and candidate

Write `BEFORE.md`, `AFTER.md`, `COMMANDS.tsv`, literal manifests, reference census, package-boundary census, Atlas before/after, and cleanup receipt under `docs/orders/evidence/golden-baseline/g3/`.

Commit product/QA/docs changes, regenerate Atlas from a clean candidate, commit generated outputs/evidence, then record:

- `BUILD_BASE_SHA`;
- immutable candidate SHA;
- product/config tree identity for any evidence-only commit;
- exact candidate parent chain;
- clean upstream match.

## Throughput and stops

A red that changes product behavior, semantic authority, acceptance meaning, group scope/order, supported compatibility, or PASS meaning requires semantic Reader adjudication.

A red proven on the frozen starting SHA and limited to same-meaning classification, selector, allowlist, invocation, teardown, generated metadata, or receipt formatting may be repaired directly by the Router. It receives one focused old-red/new-green falsifier and non-regression proof.

Independent commands may run concurrently only without shared-state mutation. Exact-byte receipts may be reused when relevant bytes/configuration are equal. One immutable candidate and one independent Verifier remain mandatory.

The same semantic assertion red twice after repair stops G3. A proven red owned by another Golden group is assigned there only when G3 non-regression remains independently provable.

G3 may not merge to `main`, open G4 Builder authority, begin R18, or combine groups.
