# WO-GOLDEN-G6 — Remove the false Claude production identity

status: **DRAFT / FRESH SEMANTIC READER PENDING**
order-type: Golden Baseline Phase 2 bounded semantic group
current-evidence-branch: `wo-golden-g2`
future-builder-branch: `wo-golden-g6` (worktree only; no implementation is authorized in the current checkout)
parent-group: G5 **CLOSED / PASS WITH INHERITED G8/G12 REDS**
r18-authority: **FROZEN**
builder-authority: **CLOSED UNTIL FRESH READER YES / YES**
starting-evidence-head: `bd3135edfe7004b140874fd2dcbef16ddb433540`
starting-product-candidate: `0cd9f273e46fb0c8ca7d05847b1fd805b8817a65`
starting-product-tree: `df9a4f11c421ed1c18418bbb8a73d0a5a756cd27`
phase-1-source-sha: `5882ab2febf00f2c15a94c868c191420ed561bb`
phase-1-source-denominator: `187/187 tracked files; aggregate CCDA0367DD4EAA0F6E59AF88B718A4238BE9DBBBD1E24450A12BDBEADFCE81C4`
provisional-source-scope-task: `01a04625-d2da-7ed1-b63e-48d7eabc4059` — measured testimony only; not semantic approval

## Outcome and one meaning

Remove the deterministic heartbeat stub's false built-in Claude identity from
QuantFlow's production Dock manifests, runtime staging, package inspection and
inventory, QA bleed-through, consumer-facing identity, and live product claims.
After this order, the production inventory contains only genuine launchable
runtimes: Hermes remains the current built-in runtime. Deterministic QA
participation, if retained, is explicitly generic `qf-proof` only.

This order does not implement real Claude, R19, an external-CLI adapter, or a
new runtime. The fake adapter is removed rather than preserved as future
production staging. Generic user-owned external CLI integration remains intact:
`collab-electron/src/main/integrations.ts`, terminal/PTY support, and the Canvas
skill are outside this order's product disposition.

## Authority and sequence

The current checkout is evidence-only. A fresh semantic Reader must first answer
YES / YES to both questions below against the exact starting SHAs and this
bounded file boundary:

1. Can every acceptance gate fail on the exact false-identity, inventory,
   saved-state, and no-launch defects named here?
2. Does every deliverable have exactly one meaning, with no G7, G11, or G12
   work hidden inside G6?

Until that Reader receipt is committed, no Builder may edit product, QA, package,
or live documentation files. The provisional source-scope task is testimony for
the Reader, not authority. After Reader YES / YES, one Builder may implement
only this order in a separate worktree, then one independent Verifier decides
whether the candidate is accepted. Neither Builder nor Router self-verifies.

## Frozen context and exact denominator

The frozen Phase-1 audit covers `187/187` tracked files. The provisional current
source scan reports `119` tracked files containing Claude/Anthropic literals,
partitioned as follows: `11` false-adapter species files, `18` current
collab-electron/tools runtime/package files, `11` QA files, `23` current docs and
README files excluding history/evidence, `2` qf-atlas files, `51` historical or
evidence files, and `3` other AGENTS/.gitignore/showcase files. These counts are
source testimony and must be remeasured at the Builder freeze; they do not
authorize editing history, evidence, or unrelated provenance.

The G6 semantic denominator is finite:

| surface | measured starting state | required end state |
| --- | --- | --- |
| production Dock | 6 definitions / 13 runtime files: Hermes 4 / 8, Claude 2 / 5 | Hermes only: 4 definitions / 8 runtime files |
| QA Dock/staging | 9 profiles / 19 runtime files, including Claude QA and qf-proof | Hermes plus generic qf-proof only: 6 profiles / 13 runtime files |
| saved Kernel | 7 `agent_definition` rows; 2 Claude rows and 5 Hermes rows | exactly the same 7 rows and founder state; no delete, migration, or blocklist |
| dependency/lockfile | no Claude/Anthropic dependency in `collab-electron/bun.lock` | no dependency or lockfile change |
| Phase-1 source census | 187 / 187 tracked files; aggregate SHA above | remeasure after candidate; historical/evidence bytes unchanged |

The saved rows are the exact rows recorded in
`docs/orders/evidence/golden-baseline/g4/KERNEL-DEFINITIONS-BEFORE.json`:
`claude-code-orchestrator`, `claude-code-worker`, `hermes-critic`,
`hermes-orchestrator`, `hermes-research-director`, `hermes-worker`, and
`hermes-worker-2`. The two saved Claude rows retain their old `definition_id`,
role, `package_ref`, profile, and metadata references after package removal.

## Required semantic disposition

The Reader must accept this finite interpretation before Builder authority opens:

- Delete the entire `species/claude-code/` tree listed below. Do not leave its
  `.aospkg`, metadata marker, manifest, launch file, prompt, pack script, or
  source module as a pretend future runtime.
- Retire `qa/gates/windows-dock-species.ts` and remove its `qa/run.ts` registry
  entry. It proves the obsolete Claude/Hermes second-species contract. The
  existing generic qf-proof profiles remain covered by the current Dock,
  staging, and launch selectors.
- Remove the obsolete named `claude-code-ungranted` negative fixture. The current
  production-boundary invariant needs an explicit generic qf-proof QA boundary,
  not a Claude-named no-grant row. Do not add a replacement negative fixture;
  if a Reader finds a separately named current invariant that truly requires
  no-grant participation, stop and amend this order before implementation.
- Correct only live current claims that QuantFlow ships or launches a built-in
  Claude participant. Preserve provenance such as an author credit, historical
  receipts, frozen audit/evidence files, future R19 planning that is clearly
  future, and statements about user-owned external Claude CLI integration.
- Preserve the existing definition-runtime resolver and launchable Catalog/Dock
  projection. Availability must become false because the saved package and
  metadata are absent, not because of a hardcoded Claude ID blocklist or a
  second UI truth store.

## Exact reversible product and QA boundary

After Reader acceptance, the Builder may delete exactly these tracked files:

```text
species/claude-code/dock-profiles.json
species/claude-code/launch.json
species/claude-code/package.json
species/claude-code/packed/claude-code.aospkg
species/claude-code/packed/claude-code.meta.json
species/claude-code/packed/claude-code.mjs
species/claude-code/prompts/orchestrator.md
species/claude-code/prompts/worker.md
species/claude-code/qa-dock-profiles.json
species/claude-code/scripts/pack-agent.mjs
species/claude-code/src/claude-code.mjs
qa/gates/windows-dock-species.ts
```

The Builder may modify only these current runtime/package/QA/UI files, and only
to remove the false built-in identity, preserve Hermes and qf-proof, and prove
the saved-row refusal contract:

```text
collab-electron/src/main/dock-profiles.ts
collab-electron/src/main/dock-profiles.test.ts
collab-electron/src/main/agent-host.ts
collab-electron/scripts/package-lib/runtime-staging.ts
collab-electron/scripts/package-lib/runtime-staging.test.ts
collab-electron/scripts/package-lib/package-inspect.ts
collab-electron/scripts/package-lib/package-inspect.test.ts
collab-electron/src/windows/shell/src/dock.js
collab-electron/packages/components/src/WorkspaceGraph/WorkspaceGraph.tsx
qa/gates/dev-dock-readiness.ts
qa/gates/dock-definition-launch/run.ts
qa/gates/dock-production-inventory.ts
qa/gates/kernel-one-path.ts
qa/gates/research-director-front-door.ts
qa/run.ts
```

The Builder may modify only these seven current product/contract documents to
remove direct false present-tense built-in claims, with no broad G11 rewrite:

```text
README.md
docs/DEBT.md
docs/DOCTRINE.md
docs/RESEARCH.md
docs/orders/GOLDEN-RUN.md
docs/proposals/CAPABILITY-REGISTRY.md
docs/proposals/V2-SCOPE.md
```

The exact documentation rule is: correct a live claim that says the current
product ships or launches Claude; retain external CLI wording, future R19
wording, and provenance/history. Do not edit `docs/history/**`, existing
`docs/orders/evidence/**`, Obsidian frozen Phase-1 files, or any file outside
the lists above except generated Atlas output after the product candidate is
green.

Explicit no-touch product paths include the generic external integration and
terminal seams: `collab-electron/src/main/integrations.ts` and its test,
`collab-electron/src/main/pty.ts`,
`collab-electron/packages/collab-canvas-skill/skills/collab-canvas/SKILL.md`,
`collab-electron/packages/components/src/Terminal/TerminalTab.tsx`, and the
shared viewer-item files. Do not change `species/hermes/**`,
`tools/qf-proof-agent/**`, the Kernel schema/write path, user databases, or
dependency manifests/lockfiles.

## Runtime and saved-state contract

The product candidate must prove all of the following from the existing
Kernel-backed path:

1. `PRODUCTION_DOCK_PROFILE_MANIFESTS` and production runtime staging contain
   Hermes only. Package inspection/inventory sees only genuine launchable
   production runtime resources. No production manifest, staged path,
   package metadata, or inventory row contains the removed fake species.
2. QA staging contains only Hermes and generic qf-proof profiles. The qf-proof
   package remains deterministic and explicitly QA-only; it is not added to the
   production inventory.
3. All seven saved `agent_definition` rows and founder state remain byte/value
   identical. No database write, migration, deletion, hardcoded ID blocklist,
   or alternate UI availability store is introduced.
4. For each saved Claude row, `resolveDefinitionRuntime` reports unavailable
   because its package/metadata cannot resolve. The definitions list may expose
   that deterministic `availability=false` projection, while the launchable
   Catalog/Dock excludes the row.
5. A direct spawn attempt for either saved Claude row refuses before creation of
   a new `AgentSession`, `spawned_from` link, runtime callback, or OS process.
   A pending UI notification is not a durable session and does not satisfy the
   launch contract. Existing historical sessions and lineage may retain the old
   display identity.
6. Hermes launch, generic qf-proof QA participation, PTY/terminal behavior,
   Canvas navigation, and generic external CLI integration remain current and
   tested. No real Claude/R19 path is claimed.

The saved-state proof must use a read-only copy or in-memory fixture when a
test needs to exercise the missing package. It must not mutate the canonical
`C:\Users\rybow\.quantflow\kernel.db`. The final receipt records row IDs,
values, availability projection, refusal timing, durable object/link counts,
process count, and cleanup; it does not copy credentials or database secrets.

## Required normal gates

The Builder records unedited output and exit status for this bounded matrix;
the independent Verifier reruns it at the immutable candidate:

```text
bun qa/run.ts repo-shape
bun qa/run.ts doc-links
bun qa/run.ts rung-ladder
bun qa/run.ts dock-production-inventory
bun qa/run.ts dev-dock-readiness
bun qa/run.ts dock-definition-launch
bun qa/run.ts kernel-one-path
bun qa/run.ts research-director-front-door
bun test collab-electron/src/main/dock-profiles.test.ts
bun test collab-electron/scripts/package-lib/runtime-staging.test.ts
bun test collab-electron/scripts/package-lib/package-inspect.test.ts
bun qa/run.ts hermes-launch-policy
bun qa/run.ts golden-g4-retired-route
bun qa/run.ts golden-g5-consumer-census
bun qa/run.ts golden-g5-saved-state
bun qa/run.ts kernel-sole-writer-app
bun run --cwd collab-electron build
git diff --check
```

The three staging/inspection tests are the package proof; the inherited
`package-closure` selector is not part of G6 because its known platform/install
red is G12-owned. G6 does not require the full installer or Windows
cold-boot/release matrix.
Full installer, platform, userData, signing, and operations requalification is
G12-owned. G8/G9 remain in their existing order. G6 must not open G7, G11, or
G12 broad work, and must not claim a packaged release PASS from this matrix.

## Fail-capable falsifiers

Each falsifier runs in an isolated temporary fixture or an explicit gate bait
mode, exits nonzero, prints the named defect, restores the fixture, and reruns
the corresponding normal selector to exit zero. An unexpectedly green falsifier
or a failed restore fails G6. The exact bait names are part of the gate contract:

```text
$env:QF_G6_FALSIFY="production-claude-manifest"; bun qa/run.ts dock-production-inventory
$env:QF_G6_FALSIFY="qa-fixture-leak"; bun qa/run.ts dock-production-inventory
$env:QF_G6_FALSIFY="package-claude-resource"; bun qa/run.ts dev-dock-readiness
$env:QF_G6_FALSIFY="saved-claude-launchable"; bun qa/run.ts dock-definition-launch
$env:QF_G6_FALSIFY="spawn-before-refusal"; bun qa/run.ts dock-definition-launch
$env:QF_G6_FALSIFY="workspace-identity"; bun qa/run.ts dock-definition-launch
$env:QF_G6_FALSIFY="hermes-resource-loss"; bun test collab-electron/scripts/package-lib/runtime-staging.test.ts
$env:QF_G6_FALSIFY="external-cli-seam"; bun qa/run.ts research-director-front-door
```

The falsifier implementation may be added only inside the existing listed
selectors and must exercise the real assertions. It may not hardcode success,
replace a package with a fixture that is not inspected, weaken the refusal
boundary, or create a second source of truth. After each case, clear the
environment variable, verify the source/package fixture is restored, and rerun
the same normal command. The external-CLI bait is a preservation check: it must
fail if G6 accidentally edits the generic seam, and pass after exact restore.

## Atlas, cleanup, and process evidence

Record the starting Atlas identity from the current evidence head but do not
run or regenerate Atlas in this Router packet. Only after the product candidate
passes the bounded matrix may the Builder run `bun qf-atlas/generate.mjs`, then
`bun qf-atlas/generate.mjs --check` and `node qf-atlas/falsify.mjs` as applicable;
generated output is not hand-edited. Atlas does not establish product
availability or saved-state compatibility.

Before and after every gate family, record exact Bun/Electron/Node process
counts and temporary roots owned by that family. G6 may not clean the inherited
G8/G12 G5 roots `x0W0CL` or `Fz8BQs`; those remain named evidence and outside
this order. A G6-owned candidate run must finish with no Bun/Electron process,
no newly created root, `roots_remaining=0`, and `leaked=[]`. Any EACCES,
orphaned pty sidecar, or unexplained root is a red owned by the correct later
group, not a PASS.

## Evidence boundary and receipt sequence

This Router packet creates only the fresh-reader scaffold in
`docs/orders/evidence/golden-baseline/g6/`: `BEFORE.md`,
`STARTING-MATRIX.tsv`, and `READER-ACCEPTANCE.md`. After Reader YES / YES and
only after a product candidate exists, the Builder may add exactly
`COMMANDS.tsv`, `FALSIFIERS.tsv`, `AFTER.md`, `VERIFIER-ACCEPTANCE.md`, and
`GROUP-ACCEPTANCE.md` in that directory. Those receipts must bind the exact
starting/evidence/product SHAs and tree, changed/deleted path list, denominator,
normal matrix, falsifier red/restore-green pairs, seven-row saved-state proof,
package staging/inventory counts, external-seam preservation, process/root
cleanup, and inherited-red ownership.

The Reader receipt is semantic and precedes all product work. The Verifier
receipt is independent and may not modify, regenerate, clean, or repair the
candidate. G6 closes only when the Verifier confirms the finite acceptance
semantics below and no unowned red remains.

## Rollback boundary and finite acceptance

The product rollback boundary is the immutable G5 candidate
`0cd9f273e46fb0c8ca7d05847b1fd805b8817a65` with tree
`df9a4f11c421ed1c18418bbb8a73d0a5a756cd27`; revert the G6 implementation
commit(s) to that boundary if acceptance fails. Do not reset shared history,
delete user data, or mutate the canonical database. The evidence commit is
separate from product implementation and is not a product rollback target.

G6 is accepted only if all of these are true:

- production inventory is exactly genuine launchable Hermes, with no Claude
  fake package, manifest, metadata, staged resource, or consumer-facing
  present-tense built-in claim;
- QA deterministic participation is only generic qf-proof, and no QA identity
  leaks into production;
- all seven saved definitions and founder state are preserved, saved Claude
  rows project unavailable/nonlaunchable, and lineage is preserved;
- each saved fake-row spawn refuses before a new durable session/link/runtime
  callback/process;
- Hermes, qf-proof, Canvas, PTY, and generic external-CLI seams remain green;
- every normal gate exits zero, every falsifier exits nonzero then restores to
  green, package staging/inventory is proved without the full installer, and
  G6-owned processes/roots are clean;
- no dependency/lockfile change exists, historical/evidence files remain
  byte-for-byte unchanged, and no G7/G11/G12 broad work is included.

Any different changed path, new truth store, missing saved-row proof, fake
package retained as production/future staging, real Claude implementation,
packaged release claim, inherited-root cleanup, or unowned red returns the
candidate to the Reader/owner instead of closing G6.

## Reader handoff

Read `docs/orders/evidence/golden-baseline/g6/BEFORE.md` and
`STARTING-MATRIX.tsv`, the frozen Phase-1 references named there, ADR-0004,
the current runtime resolver and Dock projection, and the exact files in this
order. The Reader must record YES / YES or NO / NO with finite defects in
`READER-ACCEPTANCE.md`. A YES / YES opens exactly one future G6 Builder; it does
not authorize G7, G11, G12, or R18.
