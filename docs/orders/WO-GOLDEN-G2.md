# WO-GOLDEN-G2 — Retire unbuilt and superseded residue

status: **DRAFT — READER REQUIRED; NO BUILD AUTHORITY**
order-type: Golden Baseline Phase 2 non-rung group
branch: `wo-golden-g2`
founder-approved-route: G2 — unbuilt and superseded residue
parent-group: G1 **CLOSED / ACCEPTED** at `8ebe35d7374ebca3752c94cf51a676a58e1ede62`
r18-authority: **FROZEN**
main-authority: **NONE**
release/package-authority: **NONE**
rework: no implementation lap is authorized by this draft

## Outcome

QuantFlow's active source and QA trees stop carrying eleven files that current
product, build and package entry graphs do not consume. Current proof meaning is
preserved by retargeting four affected proof surfaces to current architecture,
not by retaining the obsolete subjects.

Ryan gains no new product feature in G2. The repository gains a smaller and more
truthful active surface before current-product repairs and R18.

## Authority and sequence

This file is a semantic draft. `NEXT.md` remains on the accepted G1 checkpoint.
One fresh Reader must answer exactly:

1. Can every acceptance gate in this order actually fail on the defect it names?
2. Does every deliverable have exactly one meaning?

The Reader must return `YES/YES` before the Router may rotate `NEXT.md` to G2.
Only that rotation opens Builder authority. The Builder and independent Verifier
must be separate fresh Codex tasks. They share this one checkout and do not use a
worktree, clone, helper framework or second repository copy.

No G2 step may merge to `main`, begin R18, or absorb G3+ work.

## Frozen starting evidence

The G2 branch begins at the accepted G1 closure:

`8ebe35d7374ebca3752c94cf51a676a58e1ede62`

The Builder records its clean post-pull HEAD as `BUILD_BASE_SHA`. The final G2
candidate must have that exact parent.

The eleven authorized tracked targets and their required starting bytes are:

| Literal path | bytes | SHA-256 |
|---|---:|---|
| `collab-electron/src/main/a2a-artifact-store.ts` | 1408 | `5313A9A95E52D515C7A9157262863E043493AACDC58E530378D0F2AF98E29C28` |
| `collab-electron/src/main/a2a-bus.ts` | 2704 | `A3EE7D49A0B396281DBB98B3111311905112BC90FCFCD0C4D97F626543FFA85A` |
| `collab-electron/src/main/a2a-orchestra.ts` | 5123 | `B38B9BC4C8AE3F3E84E64F87A71D0ECC889A1D0921B319AC74FAE49E97CB01D1` |
| `collab-electron/src/main/species-launch.ts` | 3346 | `0E6B3402F2A0B40A90B30B164B6D65467D1ABC7333E9F805EBEACCA4086A1109` |
| `collab-electron/src/main/species-surface.ts` | 3260 | `254A4034A44418322A8A22ABFDBE9B412D8F2649C1BC720E1BEEB54854437F18` |
| `collab-electron/src/main/species-tools.ts` | 2115 | `C3F1E001A169D2E4C2B8192C1399EA4F34CA4CAE77EBF33ECD25DBAD2F008BF0` |
| `collab-electron/src/windows/shared/flow-cube/cube3d.js` | 4830 | `938B6CFBF6151A1AF493AF5D7638BF67EF271B0BBED7A0A607849676A382DD9E` |
| `collab-electron/qa/r13-consumer-workflow.check.ts` | 2932 | `05A49E2C04E90F833DA45AE99F087D790F3F5EB915EE71F440CFD8294006FF2B` |
| `qa/fixtures/charter-101.md` | 2012 | `1DDC060EC8A50C949078EB8FA494557620F4E4CCAE05E1AA2B5735E62B717A86` |
| `collab-electron/docs/superpowers/specs/2026-03-23-ipc-workspace-graph-modularization-design.md` | 5753 | `605172B5315D11AD373CC5424A8AB8D374EB026FBDB939F2C84E32494F09EC75` |
| `collab-electron/docs/superpowers/specs/2026-04-05-canvas-event-log-design.md` | 8026 | `E1DCD440A17D65A9187751CE91550A36E9314B7F2644D1F81400CE4C7253F1C5` |

If any target is absent or its bytes differ before Builder mutation, stop. The
order no longer describes the checkout and may not guess.

## Deliverable A — Prove the disposition before deletion

Create `docs/orders/evidence/golden-baseline/g2/BEFORE.md` with:

- `BUILD_BASE_SHA`, clean status and exact 11-row path/size/SHA-256 manifest;
- entry-graph, build-input, built-output and package-resource census;
- literal import/read/string references outside generated Atlas outputs and
  historical evidence;
- current QA references and the invariant each one protects;
- proof that no production Dock profile, runtime route, preload bridge, main
  entry, renderer entry or package resource selects an authorized target.

The census must distinguish a real production consumer from a QA assertion,
history, generated Atlas projection, comment or filename string.

The expected live references are not deletion blockers by themselves:

- `qa/gates/artifact-root/run.ts` directly imports the A2A store and names the
  A2A bus to test a now-retired publisher;
- `collab-electron/scripts/package-lib/shared-paths.test.ts` reads two orphaned
  species files as static packaging-path subjects;
- `qa/gates/one-skin.ts` allowlists the unbuilt cube file;
- Atlas decisions and falsifiers use four targets as historical analyzer
  subjects.

Any other runtime/build/package consumer stops G2.

Map the obsolete R13 check's question-to-report and recovery assertions to the
accepted current research gates. Do not create a replacement test merely to
retain an obsolete string-findings contract. Map the charter and two design
specs as historical/manual evidence with no executable or boot-authority role.

## Deliverable B — Preserve the three historical documents outside active main

Before deleting history, copy these exact bytes:

- `qa/fixtures/charter-101.md`;
- both `collab-electron/docs/superpowers/specs/*.md` targets above;

to the exact immutable evidence root:

`C:\Users\rybow\Obsidian\QuantFlow Vault\2026-08-24\QuantFlow Repository Golden Baseline 5882ab2\phase-2\g2-history`

Preserve their repository-relative paths beneath that root. Add a Vault manifest
containing source path, archived path, byte length, source SHA-256, archived
SHA-256, G2 base SHA and UTC copy time. Verify source and archived hashes are
identical before deletion.

In the repository, add
`docs/orders/evidence/golden-baseline/g2/VAULT-ARCHIVE-RECEIPT.md` with the same
non-private metadata and the Vault manifest SHA-256. Do not commit duplicate raw
history into another active repository directory.

The other eight targets are source/QA residue retained by Git history; they do
not require an extra Vault copy.

## Deliverable C — Delete exactly the eleven targets

Delete all and only the eleven literal tracked paths in the frozen table. No
wildcards, parent deletion, directory sweep, dependency edit, product behavior
change or opportunistic cleanup is authorized.

After deletion, direct literal absence is a required assertion. A missing target
before Builder mutation is not a pre-existing pass; it is a stop under the
starting-byte contract.

## Deliverable D — Retarget current proof without weakening it

Four proof corrections are required because their old subjects leave.

### D1 — Artifact publication root

In `qa/gates/artifact-root/run.ts`:

- remove the A2A store import, A2A-only byte/publication exercise and A2A bus
  coupling assertion;
- preserve the default/env artifact-root checks, non-directory refusal,
  production writer byte/hash/storage-root proof and install-plan proof;
- keep the exhaustive direct `publish_artifact` production scan;
- change its exact expected publisher set from `a2a-bus.ts, agent-host.ts` to
  `agent-host.ts` only;
- retain the coverage floor and proof that `agent-host.ts` was actually scanned.

The gate must still fail if `agent-host.ts` stops using the production writer,
publishes outside the resolved root, or any additional direct production
publisher appears. Removing a retired publisher may narrow the expected set; it
may not relax publisher exhaustiveness.

### D2 — Shared package-resource paths

In `collab-electron/scripts/package-lib/shared-paths.test.ts`, replace the two
orphan species source reads with at least two current production consumers of
`./package-resource-paths`, selected from `agent-host.ts`,
`host-native-tui.ts`, and `runtime-adapter.ts`.

Keep the package-inspection re-export assertion and the exact meta/allowlist path
expectations. The test must fail if package inspection or current production
consumers stop using the shared path module.

### D3 — One skin

Remove only the deleted `cube3d.js` exception from `qa/gates/one-skin.ts`. Do not
add a replacement exception or relax the token/palette rules.

### D4 — Obsolete QA/history

Do not replace `r13-consumer-workflow.check.ts` or `charter-101.md` with new
active-tree fixtures. Their valid current invariants must be named in the G2
evidence mapping and remain protected by already-current gates.

## Deliverable E — Keep Atlas honest on current subjects

This is test-fixture maintenance, not Atlas capability work.

1. Preserve the full prior text of these four superseded decisions in G2
   evidence, then remove their entries from `qf-atlas/decisions.json`:
   - `unreachable:collab-electron/src/main/a2a-bus.ts`;
   - `unreachable:collab-electron/src/windows/shared/flow-cube/cube3d.js`;
   - `unreachable:collab-electron/src/main/species-launch.ts`;
   - `unreachable:collab-electron/src/main/species-tools.ts`.
2. Update the human comment ledger in `decisions.json` to state that the G2
   founder disposition superseded and retired those source-bound decisions.
3. Retarget falsifier 42 to the current external-anchor case:
   `qa/gates/dock-production-inventory.ts` importing
   `collab-electron/src/main/dock-profiles.ts`. Its meaning remains: an importer
   outside product source anchors its target.
4. Retarget falsifier 43 to the current `agent-host.ts` filename in the artifact
   publisher assertion. Its meaning remains: a filename string in QA cannot
   manufacture a `process-entry` verdict.
5. Update only the now-stale A2A-specific explanatory comments in
   `qf-atlas/generate.mjs` and `qf-atlas/reach.mjs`; do not change reachability
   semantics.
6. Regenerate `ATLAS.md`, `atlas.json`, and `atlas.html`; run the falsifiers in
   receipt mode once to update `falsifiers.json`.

The falsifier count may not shrink, falsifier numbers 42 and 43 may not be
deleted, and all falsifiers must pass. Atlas must remain HARD RED 0. The seven
deleted product-scope rows must disappear; no unrelated current-product file may
become unreachable or acquire a stronger/weaker reach verdict without a named
causal explanation in `AFTER.md`.

`qf-atlas/demolition-proof.md` and historical orders/evidence are G11 history
compression surfaces, not G2 authority. Do not rewrite or archive them here.

## Deliverable F — Exact candidate and evidence

Create:

- `BEFORE.md`;
- `AFTER.md`;
- `COMMANDS.tsv` with sequence, command, start/end UTC, exit and log SHA-256;
- `VAULT-ARCHIVE-RECEIPT.md`;
- bounded command logs under
  `docs/orders/evidence/golden-baseline/g2/logs/`.

Use direct commands. Do not build a runner, manifest framework, JSON event
stream or supervision wrapper.

The candidate may contain only:

- the eleven exact deletions;
- `qa/gates/artifact-root/run.ts`;
- `collab-electron/scripts/package-lib/shared-paths.test.ts`;
- `qa/gates/one-skin.ts`;
- `qf-atlas/decisions.json`;
- `qf-atlas/falsify.mjs`;
- comment-only edits in `qf-atlas/generate.mjs` and `qf-atlas/reach.mjs`;
- generated `qf-atlas/ATLAS.md`, `atlas.json`, `atlas.html`, and
  `falsifiers.json`;
- G2 evidence under `docs/orders/evidence/golden-baseline/g2/**`.

No lockfile, dependency declaration, product implementation, package config,
Dock inventory, Kernel/schema, Canvas, runtime adapter or R18 file may change.

## Focused Builder matrix

Run in this order after edits and generation:

1. `bun test collab-electron/scripts/package-lib/shared-paths.test.ts`
2. `bun qa/run.ts artifact-root`
3. `bun qa/run.ts one-skin`
4. `bun qa/run.ts observe-door`
5. `bun qa/run.ts kernel-sole-writer-app`
6. `bun qa/run.ts repo-shape`
7. `bun qa/run.ts doc-links`
8. `bun qa/run.ts rung-ladder`
9. `bun qf-atlas/generate.mjs --check`
10. `bun qf-atlas/falsify.mjs --receipt`
11. `bun qf-atlas/ratchet.mjs`
12. `bun run build` from `collab-electron`
13. direct 11-path absence and build-output/package-input census
14. `git diff --check`
15. `git diff --cached --check`
16. product-process census equals zero

No release, installer, packaged-app, slow Hermes, full `--all`, or R18 gate is
authorized. The build is sufficient to prove the deleted modules are absent
from current compiled entries; G12 owns clean package/installer qualification.

Any non-zero exit is red. A documented search with zero matches may use exit 1
only when the receipt names that expected grep/rg convention and separately
asserts zero consumers.

## Candidate protocol

The Builder:

1. pulls `origin/wo-golden-g2` and requires a clean tree;
2. records `BUILD_BASE_SHA` and proves the accepted G1 closure is its ancestor;
3. executes only this order;
4. stages the exact allowlist and runs both diff checks;
5. commits one immutable candidate whose parent is `BUILD_BASE_SHA`;
6. pushes `wo-golden-g2` and stops.

The Builder may make mechanical corrections inside the explicit D/E proof files
while building, provided acceptance meaning does not change. Product code outside
the eleven deletions is never in G2 scope.

## Independent Verifier

One fresh read-only Verifier binds to the immutable candidate and reruns:

- target/hash/archive and exact-diff adjudication;
- all focused matrix commands except falsifier receipt mode, using
  `bun qf-atlas/falsify.mjs` so verification is tree-neutral;
- the 11-path absence, output/package census, Atlas causal-diff, final clean tree
  and zero-process checks.

It records `sha_before == sha_after == CANDIDATE_SHA`. Any red stops G2. The
Verifier may not edit, repair, commit, merge, rotate `NEXT.md`, or begin G3.

## Stop conditions

Stop without deletion or further repair if:

- starting SHA/bytes or checkout cleanliness do not match;
- a target has a production runtime, build, package, compatibility or current
  user-state consumer not named here;
- preserving a current invariant requires product code or a file outside the
  candidate allowlist;
- a proof must be weakened, deleted or have its acceptance meaning changed;
- an Atlas falsifier count shrinks or current-product reachability changes
  outside the seven expected deleted rows without exact causal proof;
- any focused matrix item stays red after the allowed mechanical correction;
- the same semantic assertion goes red twice;
- product processes cannot be reduced to zero.

On independent PASS, the Router writes the G2 closure receipt and may draft G3.
Nothing reaches `main` without the protocol's founder stop, and R18 remains frozen.
