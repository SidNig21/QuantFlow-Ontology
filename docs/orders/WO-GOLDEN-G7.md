# WO-GOLDEN-G7 — Contract unconsumed protocol and direct dependencies

status: **DRAFT / FRESH SEMANTIC READER PENDING**
order-type: Golden Baseline Phase 2 bounded protocol/dependency group
current-evidence-branch: `wo-golden-g2`
future-builder-branch: `wo-golden-g7` (worktree only; no implementation is authorized in the current checkout)
parent-group: G6 **CLOSED / PASS WITH INHERITED G8/G12 REDS**
r18-authority: **FROZEN**
builder-authority: **CLOSED UNTIL FRESH READER YES / YES**
starting-evidence-head: `4e037c69268ffd4a62f0e9aa933686c6f8c3c93e`
starting-evidence-tree: `60242660d62d8a1da96233c286c56d0b6176a91e`
starting-product-candidate: `8dbc19162be9c42303fd79c3c942385a17726f31`
starting-product-tree: `7cee1e3d8e8444d48c8048f344f44ef33db594e2`
phase-1-source-sha: `5882ab2febf00f2c15a94c868c191420ed561bb4`
phase-1-tracked-denominator: `1,150 tracked files`
phase-1-direct-dependency-denominator: `153 direct dependency declarations`
phase-1-electron-package-denominator: `19 Electron package declarations/hooks`
phase-1-operational-root-denominator: `40 bounded operational roots`
phase-1-provisional-status: frozen disposition; remeasure exact current consumers before mutation

## Outcome and one meaning

Remove or contract only protocol bridges and direct dependencies that have no
current consumer after a complete source, dynamic, package, compatibility, QA,
and named-future census. If a live wire or package is removed, the corresponding
current product proof must fail before the candidate is accepted.

## In plain terms

QuantFlow should stop carrying unused connections and tools while everything people currently use keeps working; if a connection or tool is still needed, the proof must stop its removal.

G7 is a surgical dependency and protocol contraction. It does not redesign the
Electron transport, replace MCP/ACP/PTY, repair Kernel/schema/law defects, or
turn Atlas findings into deletion authority. A protocol bridge means its full
registered-main, preload/type, caller, dynamic/tunnel, package, and supported
state contract—not a matching string. A direct dependency means a declaration in
one of the exact manifests below; a lock entry is removable only as part of the
unreachable closure after a declaration is removed.

## Authority and sequence

G6 is independently closed at the exact candidate and evidence head above. A
fresh semantic Reader must first answer YES / YES to the two questions below
against this order, the frozen Phase-1 disposition, the G6 closure receipts, and
the exact starting tree. Until that receipt is committed, no G7 Builder may edit
source, tests, manifests, locks, QA, or generated output.

1. Can every normal gate and falsifier fail on the exact live-protocol,
   dynamic-tunnel, package-closure, compatibility, and protected-current-seam
   defect named here?
2. Does every deliverable have exactly one meaning, with G8/G9/G10/G11/G12,
   real Claude/R19, and R18 explicitly outside G7?

After Reader YES / YES, exactly one Builder may implement only this order in a
separate `wo-golden-g7` worktree. One independent Verifier then reruns the
focused matrix against the immutable candidate. The current checkout remains
docs/evidence-only. The provisional Atlas map and any prior source scan are
testimony, not permission.

## Frozen denominator and starting testimony

The Phase-1 audit at `5882ab2febf00f2c15a94c868c191420ed561bb4` is the source
denominator: all `1,150` tracked files, all `153` direct dependency
declarations, all `19` Electron package declarations/hooks, and all `40`
bounded operational roots. The Builder must freeze literal path/byte/SHA-256
manifests for the exact current tree before editing; counts alone are not a
consumer proof. Historical, evidence, generated, dependency-cache, and
disposable-root occurrences are classified separately and do not become live
consumers merely by containing a protocol or package name.

The current generated Atlas is a starting map only. At the G6 product tree it
reports `403` scanned files, `124` main IPC channels, `124` bridge methods,
`106` bridge methods with a static caller, `5` broken bridge calls, `11`
unused channels, `5` dead channels, `2` protocol variants, `44` push channels,
`1` push no-sender, `33` bridge blind spots, and `6` dynamic push sites. These
figures must be remeasured at the G7 Builder freeze and cannot authorize a
delete. Dynamic and package-blind spots are a stop condition until ruled out.

The exact protocol starting sets are the current app's two preload bridges:

```text
collab-electron/src/preload/universal.ts
collab-electron/src/preload/shell.ts
```

and the current main registration/type/caller boundary:

```text
collab-electron/src/main/index.ts
collab-electron/src/main/ipc.ts
collab-electron/src/main/ipc-browser.ts
collab-electron/src/main/ipc-canvas.ts
collab-electron/src/main/ipc-endpoint.ts
collab-electron/src/main/ipc-filesystem.ts
collab-electron/src/main/ipc-kernel.ts
collab-electron/src/main/ipc-knowledge.ts
collab-electron/src/main/ipc-misc.ts
collab-electron/src/main/ipc-workspace.ts
collab-electron/src/main/connections-ipc.ts
collab-electron/packages/shared/src/window-api.d.ts
collab-electron/src/main/pty.ts
collab-electron/src/windows/shell/src/canvas-rpc.js
collab-electron/src/windows/shell/src/canvas-rpc.test.ts
collab-electron/packages/components/src/WorkspaceGraph/WorkspaceGraph.tsx
```

The two registered protocols on the same PTY channel are separate starting
variants and must be counted separately:

```text
pty:write          ipcMain.handle + ipcRenderer.send; send is current
pty:send-raw-keys  ipcMain.handle + ipcRenderer.send; send is current
```

The `ipcMain.handle` variant may be removed only if the complete dynamic,
packaged, type, and supported-current-consumer census proves zero callers while
the `send` variant remains byte/behavior intact. The `shell:forward` tunnel and
its inner channels are one transport contract, not twelve independent delete
licenses.

## Frozen starting matrix

The G7 Reader starts from the independently verified G6 evidence head, not from
the current working tree's uncommitted documentation. The exact starting
identity is evidence head `4e037c69268ffd4a62f0e9aa933686c6f8c3c93e` with tree
`60242660d62d8a1da96233c286c56d0b6176a91e`, product candidate
`8dbc19162be9c42303fd79c3c942385a17726f31` with tree
`7cee1e3d8e8444d48c8048f344f44ef33db594e2`, and the G6 result `16 PASS / 3
INHERITED_RED`. The three inherited reds remain exactly `kernel-one-path`
(G8, 13 offenders), `package-inspect.test.ts` (G12, 12 pass / 3 Windows
fixture failures), and `hermes-launch-policy` (G12, WSL `E_ACCESSDENIED`);
none is a G7 acceptance pass or a G7 repair target.

Before any G7 mutation, the Builder must record a fresh, literal starting
matrix in `g7/BEFORE.md`: all 20 manifest paths and 15 lockfile paths above;
all 18 protocol-boundary paths and separate PTY variants; current consumer,
reachability, package/runtime, supported-compatibility, QA, and named-future
classifications; exact process/root counts; and the current Atlas identity.
The required matrix is a baseline receipt, not permission to delete. Any
discrepancy from the frozen Phase-1 denominators or any unresolved dynamic or
package-blind path stops the Builder before source mutation.

## Current consumer and ownership map

The following are starting observations and required classifications, not an
automatic removal list:

| observed surface | current evidence / required disposition |
| --- | --- |
| `agent:spawn`, `agent:prompt`, `agent:cancel`, `agent:kill`, `agent:save-messages` and their legacy listeners | Atlas marks the main variants dead; prove no current opener, preload consumer, package entry, supported state, or named future use before removing the dead bridge residue. Do not replace it with a fake agent path. |
| `browser:scroll`, `browser:wait`, `browser:info`, `browser:evaluate` | Atlas finds static main registrations without a paired caller, but `canvas-rpc.js` has five broken bridge calls (`browserEvaluate`, `browserInfo`, `browserScroll`, `browserWait`, `focusAgentSession`). Do not delete or repair these in G7 on static evidence alone; route a live browser/canvas finding to G10 or stop and amend the order. |
| `pty:write` and `pty:send-raw-keys` invoke variants | Investigate the exact `send` callers, dynamic callers, package output, and type surface. Only the proven-unconsumed invoke half may be retired; PTY/native-TUI/terminal-tile behavior is protected. |
| `shell:loading-status` | Atlas reports one preload listener without a found sender. Treat as investigate until dynamic producers, package code, and current startup behavior are ruled out. |
| the 11 statically unused bridge methods | Static absence is not deletion proof. `qf:review:projection` is a protected current R16/G10 consumer even if it is not called in the map snapshot; the remaining rows require the same dynamic/package/current-state census. |
| the 5 broken bridge calls | These are product defects or stale consumers, not protocol deletion authority. G7 may not hide them by deleting the called feature; a live feature routes to its owner. |
| `shell:forward` and its tunneled inner channels | Preserve the transport and prove the exact tunnel. A regex-only scan that drops inner channels is a failed census. |

The current protected consumers include Research Director submission and
projection, `qf:sessions:spawn`, Dock and saved-state paths, the current Canvas
and session/terminal tiles, native-TUI/PTY input/output/cleanup, host-ACP,
Hermes, generic qf-proof QA, Files/viewer, updater, and generic user-owned
external CLI integration. G7 may not relabel, replace, or weaken any of these.

The direct-dependency census must classify every one of the `153` declarations
against static imports, dynamic imports, scripts, build/package hooks,
`extraResources`, runtime staging, QA, supported predecessor state, and named
future orders. Known protected examples include the Kernel/schema and domain
packages, `node-pty`, watcher/image/build/runtime dependencies, retained Hermes
host-ACP SDK/package surfaces, qf-proof QA dependencies, current React/Canvas/
viewer/editor surfaces, and every dependency with a positive current consumer.
The G5 Electron ACP/Agent Chat removal is already closed; do not reintroduce its
removed direct dependencies or use G7 to reopen G5. `@agentclientprotocol/sdk`
in retained Hermes host-ACP is not the removed Electron direct dependency.

The exact current manifest-path denominator is these 20 tracked manifests. This
20-path set is distinct from the frozen Phase-1 count of 19 Electron package
declarations/hooks and from the 153 direct dependency declarations; the Builder
must print both the literal path set and the declaration census before mutation:

```text
collab-electron/package.json
collab-electron/packages/components/package.json
collab-electron/packages/shared/package.json
collab-electron/packages/theme/package.json
packages/qf-kernel/package.json
qf-kernel-schema/package.json
species/hermes/package.json
species/hermes/agent-package/package.json
tools/qf-bovada-football/package.json
tools/qf-proof-agent/package.json
tools/qf-read-tools/package.json
tools/qf-vault-projection/package.json
qa/fixtures/lifecycle-command/package.json
qa/gates/artifact-root/package.json
qa/gates/boot-reconcile/package.json
qa/gates/bovada-football/package.json
qa/gates/dock-definition-launch/package.json
qa/gates/dock-profile-identity/package.json
qa/gates/kernel-drift/package.json
qa/gates/market-ingest/package.json
```

The frozen Phase-1 count is authoritative for declarations even though the
current manifest path census must be reconciled in `BEFORE.md`; if the measured
set differs, stop and record the discrepancy rather than silently changing the
denominator. The exact lockfile boundary is:

```text
collab-electron/bun.lock
packages/qf-kernel/bun.lock
qf-kernel-schema/bun.lock
species/hermes/bun.lock
tools/qf-bovada-football/bun.lock
tools/qf-read-tools/bun.lock
tools/qf-vault-projection/bun.lock
qa/fixtures/lifecycle-command/bun.lock
qa/gates/artifact-root/bun.lock
qa/gates/boot-reconcile/bun.lock
qa/gates/bovada-football/bun.lock
qa/gates/dock-definition-launch/bun.lock
qa/gates/dock-profile-identity/bun.lock
qa/gates/kernel-drift/bun.lock
qa/gates/market-ingest/bun.lock
```

## Exact reversible file boundary

After Reader YES / YES, the Builder may modify only the following files:

1. The 20 manifests and 15 lockfiles listed above, and only dependency/script/
   package-hook entries whose complete zero-consumer and lock-closure proof is
   in the G7 receipts.
2. The 18 protocol bridge/type files listed in the starting protocol sets above,
   only to remove a proven-unconsumed registration, bridge method, listener,
   stale dead caller, or duplicate PTY invoke variant. No protocol payload,
   authorization, transport ownership, or current behavior may be changed.
3. `qa/gates/golden-g7-protocol-dependencies.ts`, a new non-writing focused
   gate that owns the exact census, set/closure assertions, and falsifiers.
4. `qa/run.ts`, only to register that one new gate.
5. `collab-electron/src/main/launcher-readiness-pty.test.ts` and
   `collab-electron/src/windows/shell/src/canvas-rpc.test.ts`, only for an
   exact old-red/new-green assertion caused by a proven protocol contraction.
6. After the candidate is green, generated Atlas outputs only:
   `qf-atlas/ATLAS.md`, `qf-atlas/atlas.html`, and `qf-atlas/atlas.json`.
   They are generated, never hand-edited, and are not a semantic verdict.

No file may be deleted wholesale under this order. If a complete stale package
or protocol module is proven removable, the Builder must first name every
tracked/ignored descendant and add that literal path set to the Reader-approved
boundary; otherwise stop for an order amendment. The evidence files are added
only by the Router after the candidate and are not product rollback targets.

## Deliverables

The Builder must produce, without self-closing G7:

- `docs/orders/evidence/golden-baseline/g7/BEFORE.md` with the exact 1,150-file,
  153-declaration, 19-hook, and 40-root manifests, the 20 current manifest
  paths, and the 15 lockfiles; starting protocol sets;
  current-consumer classifications; dependency graph/lock closure; supported
  predecessor-state review; package/runtime/QA/future ownership; process/root
  baseline; Atlas identity; and all pre-existing reds.
- `docs/orders/evidence/golden-baseline/g7/COMMANDS.tsv` containing unedited
  normal command output and exit status.
- `docs/orders/evidence/golden-baseline/g7/FALSIFIERS.tsv` containing every
  bait red, exact restore, and green rerun.
- `docs/orders/evidence/golden-baseline/g7/AFTER.md` with exact changed paths,
  post-candidate dependency and protocol sets, current-consumer proof, package
  closure, protected behavior, process/root cleanup, and inherited-red owners.
- `docs/orders/evidence/golden-baseline/g7/GROUP-ACCEPTANCE.md` and
  `VERIFIER-ACCEPTANCE.md` only after the independent Verifier decides.

## Package, runtime, and compatibility ownership

G7 owns only source-level protocol/dependency contraction and its focused
consumer/closure proof. The package proof is limited to manifests, lock
closure, build output, and retained runtime/package resource identity. G7 does
not own a full installer, signing, Windows platform matrix, userData cleanup,
or operations qualification; those remain G12. G7 must preserve the G6
Hermes-only production inventory, generic qf-proof QA staging, and retained
Hermes host-ACP package semantics.

The current saved-state and Kernel compatibility contract is preservation-only:
G7 must not migrate, delete, rewrite, or blocklist user data; must not touch the
canonical Kernel database; and must not add a UI truth store. Existing session,
task, research, terminal, Canvas, Dock, external-CLI, and host-ACP state must
remain readable or follow an explicitly measured current compatibility path. A
predecessor record, package reference, or protocol consumer that the current
app restores is a live compatibility consumer; history/evidence alone is not.

G8 owns Kernel/schema/Law-B and `kernel-one-path` defects. G9 owns Report/result
authority and the process-local evidence map. G10 owns Canvas/Mission/runtime
coherence and any live browser/Canvas feature decisions. G11 owns broad
authority/history/docs compression. G12 owns full Windows package/platform/
operations qualification and the inherited Windows reds. G8/G9 order remains
unchanged and G9 remains after G8. G7 must not repair, absorb, reorder, or
reclassify any of those groups' reds.

## Required normal matrix

The Builder records unedited output for this bounded matrix; the independent
Verifier reruns the relevant commands at the immutable candidate:

```text
bun qa/run.ts repo-shape
bun qa/run.ts doc-links
bun qa/run.ts rung-ladder
bun qa/run.ts golden-g7-protocol-dependencies
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts dock-production-inventory
bun qa/run.ts golden-g5-consumer-census
bun qa/run.ts golden-g5-saved-state
bun qa/run.ts dock-definition-launch
bun qa/run.ts research-director-front-door
bun test collab-electron/src/main/integrations.test.ts
bun test collab-electron/src/main/launcher-readiness-pty.test.ts
bun test collab-electron/src/windows/shell/src/canvas-rpc.test.ts
bun run --cwd collab-electron build
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
git diff --check
```

The G6 selectors above are non-regression checks for protected current
behavior. `package-inspect.test.ts`, full installer/release, Windows cold boot,
and WSL operations are not silently promoted into G7 acceptance: G12 owns the
known package/platform/operations boundary. If a G7 edit touches a package
surface that requires one of those gates, stop and amend ownership before
mutation. The Atlas check/ratchet must be run before and after product edits;
Atlas generation happens only after the candidate source is green.

## Fail-capable falsifiers

The new G7 gate must use isolated copies or virtual bait and exercise real
assertions. Every case exits `1`, prints the exact named defect, restores the
fixture, clears the variable, and reruns the same normal command to exit `0`:

```text
$env:QF_G7_FALSIFY="required-current-bridge"; bun qa/run.ts golden-g7-protocol-dependencies  # exit 1; clear; rerun exit 0
$env:QF_G7_FALSIFY="dynamic-forward-channel"; bun qa/run.ts golden-g7-protocol-dependencies  # exit 1; clear; rerun exit 0
$env:QF_G7_FALSIFY="live-pty-send-variant"; bun qa/run.ts golden-g7-protocol-dependencies  # exit 1; clear; rerun exit 0
$env:QF_G7_FALSIFY="saved-state-consumer"; bun qa/run.ts golden-g7-protocol-dependencies  # exit 1; clear; rerun exit 0
$env:QF_G7_FALSIFY="retained-direct-dependency"; bun qa/run.ts golden-g7-protocol-dependencies  # exit 1; clear; rerun exit 0
$env:QF_G7_FALSIFY="orphan-lock-closure"; bun qa/run.ts golden-g7-protocol-dependencies  # exit 1; clear; rerun exit 0
$env:QF_G7_FALSIFY="package-runtime-resource"; bun qa/run.ts golden-g7-protocol-dependencies  # exit 1; clear; rerun exit 0
```

The baits have one meaning each: removing `qf:research:submitQuestion` or
`qf:sessions:spawn` from a copy must fail the required-current-bridge proof;
dropping `shell:forward` or a current inner channel must fail the dynamic
forward proof; dropping the active PTY `send` path must fail the PTY proof;
removing a current saved-state consumer must fail compatibility; deleting a
still-imported direct dependency must fail dependency closure; retaining an
orphan lock entry must fail closure; and removing a manifest-referenced Hermes
or qf-proof package resource must fail package/runtime identity. A falsifier
that only checks a string, a mocked import, or a hard-coded count is invalid.

Do not use a stale Atlas finding as a bait substitute. The live bridge and
package controls must be observed through the same assertion that decides
acceptance, and the restore must prove bytes/set equality and no temporary root
or process residue.

## Process, roots, rollback, and finite acceptance

Before and after every gate family record exact Bun/Electron/Node process counts
and the literal temporary roots owned by that family. G7 must finish with no
Bun/Electron process, no unexplained root, `roots_remaining=0`, and
`leaked=[]`. It must not clean the inherited G5/G8/G12 roots or any root it does
not own. EACCES, orphaned sidecar, or unexplained root is assigned to its named
owner and prevents a G7 PASS.

The rollback boundary is immutable G6 candidate
`8dbc19162be9c42303fd79c3c942385a17726f31` with tree
`7cee1e3d8e8444d48c8048f344f44ef33db594e2`. If G7 acceptance fails, revert the
G7 product commit(s) to that boundary. Do not reset shared history, delete user
data, modify the canonical database, or roll back the separate evidence commit.

G7 is accepted only when all of these hold:

- every removed protocol entry has an exact zero current/dynamic/package/
  compatibility/QA/named-future consumer proof, and every retained protocol
  has one named owner and exact set/bridge/type agreement;
- the current `send` PTY paths, `shell:forward` tunnel, Research Director,
  Dock/session/saved-state, Canvas/terminal, host-ACP, Hermes, qf-proof, and
  generic external-CLI behavior remain green;
- every removed direct declaration has a zero-consumer proof and only its exact
  unreachable lock closure leaves; no dependency upgrade or unrelated churn is
  accepted;
- package/runtime references and supported predecessor compatibility remain
  exact, with no full installer/platform claim made by G7;
- every normal gate exits zero, every G7 falsifier exits nonzero then restores
  green, generated Atlas is current after the candidate, and owned processes /
  roots are clean;
- no Kernel/schema/write-path/law change, new truth store, user-data change,
  G8/G9/G10/G11/G12 work, real Claude/R19 work, or R18 opening is included.

Any live consumer discovered after mutation, any changed path outside this
boundary, any dependency with unresolved dynamic/package use, any compatibility
ambiguity, any unowned red, or any protocol behavior change returns G7 to the
Reader/owner instead of being waived.

## Reader handoff

Read `START_HERE.md`, `docs/orders/NEXT.md`, `docs/orders/PROTOCOL.md`,
ADR-0004, the frozen Phase-1 references named by G6, all five G6 closure
receipts, `qf-atlas/ATLAS.md`, and this order. The Reader must record YES / YES
or NO / NO with finite defects in
`docs/orders/evidence/golden-baseline/g7/READER-ACCEPTANCE.md`. A YES / YES
opens exactly one G7 Builder; it does not authorize G8, G9, G10, G11, G12,
real Claude/R19, or R18.
