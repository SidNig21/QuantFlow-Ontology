# WO-GOLDEN-G6 — Remove the false Claude production identity

status: **READER ACCEPTED YES / YES / BOUNDED BUILDER AUTHORITY OPEN**
order-type: Golden Baseline Phase 2 bounded semantic group
current-evidence-branch: `wo-golden-g2`
future-builder-branch: `wo-golden-g6` (worktree only; no implementation is authorized in the current checkout)
parent-group: G5 **CLOSED / PASS WITH INHERITED G8/G12 REDS**
r18-authority: **FROZEN**
builder-authority: **OPEN — EXACTLY ONE BUILDER MAY EXECUTE THIS ORDER**
reader-task: `01a0464f-cf3a-7ca2-9d94-415f7ca8252f`
reader-amendment-sha: `4b773e2836e8fac752f584ea103dc7d6192ca43a`
reader-amendment-tree: `3e7a581700a2d0852ead260a6fdb967b857a4ee3`
reader-verdict: **YES / YES — all seven finite defects cured; no new ambiguity or scope expansion; no file changes**
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

The current checkout remains evidence-only. A fresh semantic Reader was required
to answer YES / YES to both questions below against the exact starting SHAs and
this bounded file boundary. Reader task
`01a0464f-cf3a-7ca2-9d94-415f7ca8252f` re-read amendment
`4b773e2836e8fac752f584ea103dc7d6192ca43a` (tree
`3e7a581700a2d0852ead260a6fdb967b857a4ee3`) and returned **YES / YES**, with no
new ambiguity or scope expansion and no file changes.

1. Can every acceptance gate fail on the exact false-identity, inventory,
   saved-state, and no-launch defects named here?
2. Does every deliverable have exactly one meaning, with no G7, G11, or G12
   work hidden inside G6?

The amended Reader receipt is now committed. The provisional source-scope task
is testimony for the Reader, not authority. Exactly one Builder may now implement
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
| production Dock | 6 definitions; the exact 13-path starting set is `P0` below | 4 definitions; the exact Hermes-only `P1` set is below |
| QA Dock/staging | 9 profiles; the exact 19-path starting set is `Q0` below | 6 profiles; the exact Hermes-plus-qf-proof `Q1` set is below |
| saved Kernel | 7 `agent_definition` rows; 2 Claude rows and 5 Hermes rows | the measured hash/size, seven named fields per row, and refusal counts below; no delete, migration, or blocklist |
| dependency/lockfile | no Claude/Anthropic dependency in `collab-electron/bun.lock` | no dependency or lockfile change |
| Phase-1 source census | 187 / 187 tracked files; aggregate SHA above | remeasure after candidate; historical/evidence bytes unchanged |

The saved rows are the exact rows recorded in
`docs/orders/evidence/golden-baseline/g4/KERNEL-DEFINITIONS-BEFORE.json`:
`claude-code-orchestrator`, `claude-code-worker`, `hermes-critic`,
`hermes-orchestrator`, `hermes-research-director`, `hermes-worker`, and
`hermes-worker-2`. The two saved Claude rows retain their old `definition_id`,
role, `package_ref`, profile, and metadata references after package removal.

### Exact staged path sets

These are the complete relative POSIX path sets copied by the G6 runtime
staging contract. They are set-equality contracts, not file-count shorthand.
`Control` means a byte-inspected discovery/launch/inventory file; it is not an
executable runtime resource. `Manifest-referenced runtime` means a package,
entrypoint module, or profile prompt resource named by the retained manifest or
launch contract. Every actual staged path must belong to exactly one of the
listed subsets, and the sorted actual set must equal the required set exactly.

Starting production controls `P0C`:

```text
species/hermes/dock-profiles.json
species/hermes/launch.json
species/hermes/packed/hermes.meta.json
species/hermes/tools-allowlist.json
species/claude-code/dock-profiles.json
species/claude-code/launch.json
species/claude-code/packed/claude-code.meta.json
```

Starting production manifest-referenced runtime resources `P0R`:

```text
species/hermes/packed/hermes.aospkg
species/hermes/prompts/research-director.md
species/hermes/prompts/worker.md
species/hermes/prompts/critic.md
species/claude-code/packed/claude-code.aospkg
species/claude-code/packed/claude-code.mjs
```

The starting production set is `P0 = P0C ∪ P0R`, exactly the 13 paths above.
Starting QA additions are controls `Q0C`:

```text
tools/qf-proof-agent/dock-profiles.json
tools/qf-proof-agent/launch.json
tools/qf-proof-agent/packed/qf-proof-agent.meta.json
species/claude-code/qa-dock-profiles.json
```

and manifest-referenced runtime resources `Q0R`:

```text
tools/qf-proof-agent/packed/qf-proof-agent.aospkg
tools/qf-proof-agent/packed/qf-proof-agent.mjs
```

The starting QA set is `Q0 = P0 ∪ Q0C ∪ Q0R`, exactly the 19 paths above.

Required production controls `P1C` are exactly:

```text
species/hermes/dock-profiles.json
species/hermes/launch.json
species/hermes/packed/hermes.meta.json
species/hermes/tools-allowlist.json
```

Required production manifest-referenced runtime resources `P1R` are exactly:

```text
species/hermes/packed/hermes.aospkg
species/hermes/prompts/research-director.md
species/hermes/prompts/worker.md
species/hermes/prompts/critic.md
```

The required production set is `P1 = P1C ∪ P1R`, exactly those eight Hermes
paths. Required QA additions are controls `Q1C`:

```text
tools/qf-proof-agent/dock-profiles.json
tools/qf-proof-agent/launch.json
tools/qf-proof-agent/packed/qf-proof-agent.meta.json
```

and manifest-referenced runtime resources `Q1R`:

```text
tools/qf-proof-agent/packed/qf-proof-agent.aospkg
tools/qf-proof-agent/packed/qf-proof-agent.mjs
```

The required QA set is `Q1 = P1 ∪ Q1C ∪ Q1R`, exactly those 13 paths. The
production and QA assertions must separately compare controls and runtime
resources, then compare the complete union. The exact production-resource bait
is `species/claude-code/packed/claude-code.aospkg`: inserting it into a
temporary production staging root must fail set equality. Removing the retained
`species/hermes/packed/hermes.aospkg`, or inserting
`tools/qf-proof-agent/packed/qf-proof-agent.mjs` into production, must also
fail the named missing/QA-leak assertion.

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
qa/gates/dock-definition-launch.ts
qa/run.ts
```

`qa/gates/dock-definition-launch.ts` remains the cold-safe wrapper. Its normal
child environment remains exactly the isolated `HOME` and `PATH`; when a G6
falsifier is requested, it forwards only the exact `QF_G6_FALSIFY` value in
addition to those two variables. It must not pass the ambient environment or
drop the bait variable. The three dock-definition falsifiers below therefore
run through this wrapper and are part of the same fail/restore contract.

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
3. Founder-state preservation has the exact measured scope below: the canonical
   Kernel file hash and byte size, the seven named `agent_definition` fields for
   each of the seven frozen rows, and the row/link/session counts relevant to the
   refusal proof. No database write, migration, deletion, hardcoded ID blocklist,
   or alternate UI availability store is introduced.
4. `resolveDefinitionRuntime` throws when a saved Claude row's package or
   metadata is missing. `getDockDefinitionAvailability` catches that resolver
   error and emits `available=false`; the `qf:definitions:list` projection
   carries that availability result; `launchableDockDefinitions` excludes rows
   unless `availability.available === true`.
5. The refusal proof invokes `qf:sessions:spawn`, which resolves the definition
   before calling `admitAndStartSession`. Either saved Claude row must refuse
   before a new `AgentSession`, `spawned_from` link, runtime callback, or OS
   process exists. A pending UI notification is not a durable session. The
   precreated-session path is explicitly outside this refusal assertion because
   it starts with an existing session/link; it may not be used to satisfy it.
6. Hermes launch, generic qf-proof QA participation, PTY/terminal behavior,
   Canvas navigation, and generic external CLI integration remain current and
   tested. No real Claude/R19 path is claimed.
7. WorkspaceGraph replaces the hard-coded production identity with the exact
   neutral projection label `Agent session`. This label is render-only. Saved
   sessions retain exact `sessionId`, `definition_id`, `spawned_from`, and any
   stored display/definition identity already present; an unavailable historical
   row may be projected as `Agent session`, but Kernel history is never rewritten.

### Exact founder-state comparison scope

The phrase “founder state” means only these measured comparisons, not every
table or field in the database:

- SHA-256 and byte size of the canonical
  `C:\Users\rybow\.quantflow\kernel.db` before and after the candidate;
- for each of the seven frozen row IDs, the seven `agent_definition` fields
  `name`, `role`, `package_ref`, `system_prompt_ref`, `runtime_profile`,
  `capability_groups`, and `display_name` (the row `id` only matches the row and
  is not counted as one of the seven fields);
- before/after counts of all `agent_session` rows, all `links` rows, and
  `spawned_from` links around each saved-fake spawn attempt, plus the attempted
  row/link identity and OS process count. The refusal delta for each is zero.

The final receipt must print these exact comparisons and must not claim that
unmeasured tables, columns, event history, or unrelated founder files are byte
identical.

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
bun test collab-electron/src/main/integrations.test.ts
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

The generic CLI row is mandatory. Its named assertion is
`generic-external-cli-seam-preservation`: the command above must pass, and the
pre/post SHA-256 bytes of the protected integration/PTY/Canvas/viewer seam
must match exactly. The behavior proof must continue to cover the existing
user-owned external CLI IDs and install/uninstall/status behavior; those IDs do
not constitute a built-in Dock runtime and must not be removed or relabeled by
G6.

## Fail-capable falsifiers

Each falsifier runs in an isolated temporary fixture or an explicit gate bait
mode, exits nonzero, prints the named defect, restores the fixture, and reruns
the corresponding normal selector to exit zero. An unexpectedly green falsifier
or a failed restore fails G6. The exact bait names are part of the gate contract:

```text
$env:QF_G6_FALSIFY="production-claude-manifest"; bun qa/run.ts dock-production-inventory  # exit 1; clear variable; rerun exit 0
$env:QF_G6_FALSIFY="qa-fixture-leak"; bun qa/run.ts dock-production-inventory  # exit 1; clear variable; rerun exit 0
$env:QF_G6_FALSIFY="package-claude-resource"; bun qa/run.ts dev-dock-readiness  # exit 1; clear variable; rerun exit 0
$env:QF_G6_FALSIFY="saved-claude-launchable"; bun qa/run.ts dock-definition-launch  # wrapper forwards bait; exit 1; clear; rerun exit 0
$env:QF_G6_FALSIFY="spawn-before-refusal"; bun qa/run.ts dock-definition-launch  # wrapper forwards bait; exit 1; clear; rerun exit 0
$env:QF_G6_FALSIFY="workspace-identity"; bun qa/run.ts dock-definition-launch  # wrapper forwards bait; exit 1; clear; rerun exit 0
$env:QF_G6_FALSIFY="hermes-resource-loss"; bun test collab-electron/scripts/package-lib/runtime-staging.test.ts  # exit 1; clear variable; rerun exit 0
$env:QF_G6_FALSIFY="external-cli-seam"; bun qa/run.ts research-director-front-door  # exit 1; clear variable; rerun exit 0
```

The three falsifiers routed through `qa/gates/dock-definition-launch.ts` are
bound exactly as follows: `saved-claude-launchable` must fail if the unavailable
saved row is admitted to the launchable projection; `spawn-before-refusal` must
fail if `qf:sessions:spawn` creates a new session/link/process before refusing;
and `workspace-identity` must fail if WorkspaceGraph renders the hard-coded
Claude identity. For each, the wrapper-forwarded command exits `1`; the runner
then executes `Remove-Item Env:QF_G6_FALSIFY -ErrorAction SilentlyContinue`,
reruns the same command with no bait, and records exit `0`.

The falsifier implementation may be added only inside the existing listed
selectors and the listed cold-safe wrapper, and must exercise the real
assertions. It may not hardcode success,
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
