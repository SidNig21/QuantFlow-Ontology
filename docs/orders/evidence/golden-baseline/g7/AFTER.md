# G7 builder after-receipt

Plain language: the candidate removes only proven-unused connections and direct package declarations, while the live research, Dock, Canvas, terminal, host-ACP, and package identity surfaces remain present.

## Candidate identity

| item | value |
| --- | --- |
| product candidate | `ba2b489b7378426fab976267a58eaadc5ffdaf91` |
| candidate tree | `6de625faeb677ce0e18b38825f1f4e843e0a545a` |
| candidate parent | `b422df42229bcd8c9510608ce60684e69b6021bd` |
| branch | `wo-golden-g2` |
| rollback boundary | G6 `8dbc19162be9c42303fd79c3c942385a17726f31`, tree `7cee1e3d8e8444d48c8048f344f44ef33db594e2` |
| semantic status | CLOSED — PASS WITH INHERITED REDS |

The delegated instruction to use the existing checkout was followed; no branch switch, push, reset, or shared-history rewrite occurred.

## Independent Verifier closure

Independent Verifier task `01a046fc-0548-7001-86be-78adaff82ce4` inspected the
immutable candidate and returned **PASS WITH INHERITED REDS** at evidence head
`8f13495b24e995e69f43deadeeec72ff644e111a` (tree
`39fcc664b03717dcbf9b9abdf4951152dc44bf93`). The candidate-to-evidence diff at
that head is receipt-only, with `non_receipt=0`, and the Verifier worktree was
clean. G7 closes without changing the candidate.

## Exact disposition

The literal ledger remains the row-level authority and now has six columns: exact source row, frozen baseline, final disposition, and proof code. Counts are exact: 50 protocol rows + 109 dependency rows = 159 evaluated rows; 21 removed, 133 retained, and 5 routed to G10.

| disposition | count | meaning |
| --- | ---: | --- |
| removed | 21 | 15 unconsumed protocol residues + 6 direct dependency declarations |
| retained | 133 | current/protected protocol and dependency surfaces |
| routed:G10 | 5 | four browser handlers and one broken Canvas call; retained and not hidden by G7 |

### Protocol rows

| literal ledger id | final status | proof code |
| --- | --- | --- |
| `protocol:unreached-ipc:browser:evaluate` | retained | G7-CURRENT-BRIDGE |
| `protocol:unreached-ipc:browser:info` | retained | G7-CURRENT-BRIDGE |
| `protocol:unreached-ipc:browser:scroll` | retained | G7-CURRENT-BRIDGE |
| `protocol:unreached-ipc:browser:wait` | retained | G7-CURRENT-BRIDGE |
| `protocol:unused-bridge:openFolder()→dialog:open-folder` | removed | G7-REMOVE-BRIDGE |
| `protocol:unused-bridge:openImageDialog()→dialog:open-image` | removed | G7-REMOVE-BRIDGE |
| `protocol:unused-bridge:countFiles()→fs:count-files` | removed | G7-REMOVE-BRIDGE |
| `protocol:unused-bridge:getHomePath()→get-home-path` | removed | G7-REMOVE-BRIDGE |
| `protocol:unused-bridge:deleteConnectionsForTile()→qf:connections:deleteForTile` | retained | G7-CURRENT-BRIDGE |
| `protocol:unused-bridge:getGovernedReviewProjection()→qf:review:projection` | retained | G7-CURRENT-BRIDGE |
| `protocol:unused-bridge:permissionDecision()→qf:sessions:permissionDecision` | retained | G7-CURRENT-BRIDGE |
| `protocol:unused-bridge:openSettings()→settings:open` | removed | G7-REMOVE-BRIDGE |
| `protocol:unused-bridge:openExternal()→shell:open-external` | removed | G7-REMOVE-BRIDGE |
| `protocol:unused-bridge:workspaceRemove()→workspace:remove` | removed | G7-REMOVE-BRIDGE |
| `protocol:unused-bridge:updateFrontmatter()→workspace:update-frontmatter` | removed | G7-REMOVE-BRIDGE |
| `protocol:dead-wire:agent:cancel` | removed | G7-REMOVE-DEAD-BRIDGE |
| `protocol:dead-wire:agent:kill` | removed | G7-REMOVE-DEAD-BRIDGE |
| `protocol:dead-wire:agent:prompt` | removed | G7-REMOVE-DEAD-BRIDGE |
| `protocol:dead-wire:agent:save-messages` | removed | G7-REMOVE-DEAD-BRIDGE |
| `protocol:dead-wire:agent:spawn` | removed | G7-REMOVE-DEAD-BRIDGE |
| `protocol:variant:pty:write:invoke` | removed | G7-REMOVE-PTY-INVOKE |
| `protocol:variant:pty:send-raw-keys:invoke` | removed | G7-REMOVE-PTY-INVOKE |
| `protocol:push-no-sender:shell:loading-status` | retained | G7-LOADING-INVESTIGATE |
| `protocol:broken-call:browserEvaluate` | routed:G10 | G10-BROWSER-CANVAS |
| `protocol:broken-call:browserInfo` | routed:G10 | G10-BROWSER-CANVAS |
| `protocol:broken-call:browserScroll` | routed:G10 | G10-BROWSER-CANVAS |
| `protocol:broken-call:browserWait` | routed:G10 | G10-BROWSER-CANVAS |
| `protocol:broken-call:focusAgentSession` | routed:G10 | G10-BROWSER-CANVAS |
| `protocol:shell-forward:transport` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:agent:${event.kind}` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:create-artifact-tile` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:create-graph-tile` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:create-term-tile` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:file-renamed` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:file-selected` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:files-deleted` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:folder-selected` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:fs-changed` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:handoffs-changed` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:nav-drag-active` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:open-browser-tile` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:open-terminal` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:replay:data` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:sessions-changed` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:wikilinks-updated` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:workspace-added` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:workspace-removed` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:spawn-failed` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:spawn-pending` | retained | G7-FORWARD-TUNNEL |
| `protocol:shell-forward:inner:spawn-reconciled` | retained | G7-FORWARD-TUNNEL |

Protocol removal means the exact preload/type/main residue is gone and no supported current, dynamic, package, saved-state, QA, or named-future consumer was found. Recreating it would be cheaper only if a future owner supplies a new consumer contract; no such future use is authorized here.

Protocol retention means the named live consumer or protected seam remains. Recreating it would not be cheaper than retaining the current behavior. The G10-routed rows are intentionally retained and are not G7 deletion authority.

### Dependency rows

The six removed declarations are exact rows in the ledger:

| manifest | section | package | specifier | final decision |
| --- | --- | --- | --- | --- |
| collab-electron/package.json | devDependencies | app-builder-bin | 4.2.0 | removed; direct root unused, retained electron-builder transitive 5.0.0-alpha.12 |
| collab-electron/package.json | devDependencies | class-variance-authority | ^0.7.1 | removed; no source/build/QA/future consumer |
| collab-electron/package.json | devDependencies | clsx | 2.1.1 | removed as direct declaration; transitive clsx remains reachable through Mantine |
| collab-electron/package.json | devDependencies | streamdown | 2.3.0 | removed; no source/build/QA/future consumer |
| collab-electron/package.json | devDependencies | tailwind-merge | 3.5.0 | removed; no direct or retained streamdown consumer |
| collab-electron/package.json | devDependencies | use-stick-to-bottom | 1.1.3 | removed; no source/build/QA/future consumer |

The other 103 dependency rows are retained with proof code `G7-RETAIN-DEPENDENCY`. They include Kernel/schema/domain, node-pty, watcher/image/build/runtime, React/Canvas/viewer/editor, Hermes host-ACP, qf-proof, QA, updater, and platform optional branches. The retained `@types/d3`, React types, and `@electron/rebuild` rows are compiler/lifecycle consumers despite weak literal import counts.

## Lock closure and path delta

The exact 20 manifest paths and 15 lock roots are unchanged. Only `collab-electron/package.json` and `collab-electron/bun.lock` changed. Bun lock comparison against the candidate parent found no added package entries and exactly these ten removed lock entries:

```text
class-variance-authority
hast-util-sanitize
rehype-harden
rehype-sanitize
remend
streamdown
tailwind-merge
use-stick-to-bottom
builder-util/app-builder-bin
streamdown/marked
```

The `app-builder-bin` key resolves from the removed direct 4.2.0 root to the retained `builder-util` transitive 5.0.0-alpha.12 tuple; all other common lock tuples, importer roots, lock roots, versions, and optional branches are byte/semantic-equal. The gate's orphan bait adds an unreachable lock entry and exits red, so the closure assertion is fail-capable.

## Changed product paths

The product candidate contains only:

```text
collab-electron/bun.lock
collab-electron/package.json
collab-electron/packages/shared/src/window-api.d.ts
collab-electron/src/main/index.ts
collab-electron/src/main/ipc-filesystem.ts
collab-electron/src/main/ipc-misc.ts
collab-electron/src/main/ipc-workspace.ts
collab-electron/src/preload/shell.ts
collab-electron/src/preload/universal.ts
qa/gates/golden-g7-protocol-dependencies.ts
qa/run.ts
qf-atlas/ATLAS.md
qf-atlas/atlas.html
qf-atlas/atlas.json
```

Removed protocol surfaces are limited to openFolder, openImageDialog, countFiles, getHomePath, openSettings, openExternal, workspaceRemove, updateFrontmatter, five dead agent invoke methods, and the two PTY invoke handlers. The active PTY `ipcRenderer.send` variants and `ipcMain.on` handlers remain.

## Protected behavior

The candidate gate asserts and the focused tests preserve:

- `shell:forward` target/channel/args transport, preload buffering and replacement listener, all 20 static inner channels, `agent:${event.kind}`, and `viewer:${msg.workspacePath}`;
- Research Director submission, session spawn, review projection, permission decisions, Dock connection deletion, workspace remove-by-path, and direct main external URL handling;
- Canvas/session/terminal saved-state consumers, PTY write/raw-key behavior, and the routed browser/Canvas defects;
- all 13 retained Hermes/qf-proof runtime resources and package references;
- package/runtime identity without installer, signing, native pin, Windows qualification, R18, or G8–G12 work.

### Frozen runtime/resource identity — description correction

The retained actual runtime/resource set is exactly these 13 paths:

```text
species/hermes/dock-profiles.json
species/hermes/launch.json
species/hermes/packed/hermes.meta.json
species/hermes/tools-allowlist.json
species/hermes/packed/hermes.aospkg
species/hermes/prompts/research-director.md
species/hermes/prompts/worker.md
species/hermes/prompts/critic.md
tools/qf-proof-agent/dock-profiles.json
tools/qf-proof-agent/launch.json
tools/qf-proof-agent/packed/qf-proof-agent.meta.json
tools/qf-proof-agent/packed/qf-proof-agent.aospkg
tools/qf-proof-agent/packed/qf-proof-agent.mjs
```

The earlier frozen receipt omitted the live critic prompt
`species/hermes/prompts/critic.md` from its description. This is a description
correction only: the accepted 13-file actual-byte proof, byte identity, package
references, and candidate product tree are unchanged.

## Normal matrix receipts

| command | result |
| --- | --- |
| `bun qa/run.ts repo-shape` | PASS |
| `bun qa/run.ts doc-links` | PASS; 80 live documents |
| `bun qa/run.ts rung-ladder` | PASS; 27 rungs, active R18 |
| `bun qa/run.ts golden-g7-protocol-dependencies` | PASS; manifests=20, dependencyRows=103, lockRoots=15, ledgerRows=159, staticForwardChannels=20, runtimeResources=13; Verifier: 103 retained of 109, six direct removals, ten expected lock removals |
| `bun qa/run.ts kernel-sole-writer-app` | PASS |
| `bun qa/run.ts dock-production-inventory` | PASS |
| `bun qa/run.ts golden-g5-consumer-census` | PASS |
| `bun qa/run.ts golden-g5-saved-state` | PASS |
| `bun qa/run.ts dock-definition-launch` | PASS |
| `bun qa/run.ts research-director-front-door` | inherited RED: Windows Get-CimInstance process snapshot access denied; internal falsifiers red as designed |
| focused integrations test | 12 pass, 0 fail |
| focused PTY launcher test | 1 pass, 0 fail |
| focused Canvas RPC test | 7 pass, 0 fail |
| package-resource-paths test | 4 pass, 0 fail |
| shared-paths test | 2 pass, 0 fail |
| `bun run --cwd collab-electron build` | PASS; 390 main, 2 preload, 7,783 renderer modules transformed |
| `bun qf-atlas/generate.mjs --check` | PASS; 404 files, 111 channels, 7 strip candidates |
| `bun qf-atlas/ratchet.mjs` | PASS; HARD RED=0, AMBER=23, undecided=34 |
| `git diff --check` | PASS |

## Falsifier receipts

All 30 named falsifier pairs are recorded in `FALSIFIERS.tsv`. Every pair
returned red exit `1`, restored the exact source/set, and returned green exit
`0`; the Verifier independently confirmed the pair counts. The set includes
PTY send, `shell:forward`, all 20 static inner channels, and both dynamic
sender/receiver families. No bait touched the checkout.

## Cleanup and ownership

No G7-owned temporary root remains and no Bun/Electron process remains from the builder or gate runs. The thousands of pre-existing `qf-*` temp roots were inherited and were not deleted. No canonical Kernel database, user data, or second truth store was touched.

Inherited reds remain outside G7 and are never called PASS: G8
`kernel-one-path` with the same 13 offenders; G12 `package-inspect.test.ts`
Windows fixture failures (12 pass / 3 fail); G12 Hermes launch policy WSL
`E_ACCESSDENIED`; and the inherited `research-director-front-door` Windows WMI
process-snapshot access red. G7 did not repair, absorb, relabel, or close them.

## Judgment and semantic stop

The order was silent about whether the existing checkout override should supersede stale worktree wording; the explicit delegated instruction named this checkout and no branch switch, so the Builder followed that authority. Direct `clsx` removal remained a declaration contraction, not a package deletion, because retained Mantine still reaches the lock entry. The independent Verifier stopped at the immutable candidate: no candidate repair, inherited-red repair, G8–G12 work, R18 work, native packaging work, or push.
