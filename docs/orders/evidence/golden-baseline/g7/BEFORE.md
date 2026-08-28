# G7 builder freeze — pre-mutation baseline

Plain language: this receipt records exactly what G7 inspected before removing any unused connection or package, so the later candidate can be compared with a known starting point.

## Authority and checkout

| item | value |
| --- | --- |
| order | `docs/orders/WO-GOLDEN-G7.md` |
| reader authority | `5ea8ddd8ab7b65f430198d16d21d7b28bd49945e` / tree `025dce3ad07b88e2d0d7a00c41df9d20ee2fa373` |
| G6 rollback/product baseline | `8dbc19162be9c42303fd79c3c942385a17726f31` / tree `7cee1e3d8e8444d48c8048f344f44ef33db594e2` |
| current branch | `wo-golden-g2` |
| current HEAD | `b422df42229bcd8c9510608ce60684e69b6021bd` |
| current HEAD tree | `5e34a572b8b449c6cdbceb1135ab45f6584a0293` |
| pre-mutation status | clean; no tracked or untracked changes before this receipt |
| historical source | `5882ab2febf00f2c15a94c868c191420ed561bb4` |

The explicit delegated instruction to use this existing checkout was followed; the branch was not switched and the authority head was not rewritten. Product source/configuration before G7 matches the G6 product tree; this checkout additionally carries the routed G7 evidence and authority documents.

## Frozen denominators

| set | historical provenance | measured G7 set |
| --- | ---: | ---: |
| tracked files | 1,150 | 1,346 in the current evidence checkout; not a G7 deletion denominator |
| direct dependency declarations | 153 | 109 rows in the four dependency sections |
| Electron package declarations/hooks | 19 | 20 tracked manifests |
| bounded operational roots | 40 | 15 tracked `bun.lock` roots |

The historical reconciliation is `153 - 13 - 26 - 5 = 109`: G3 `-14 + 1 = -13`, G4 `-26`, G5 `-5`, and G6 `0`. The removed G5 `overrides` entry is historical policy provenance, not a current dependency row.

## Exact current manifest set

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

Measured: `20` paths present and `109` rows across `dependencies`, `devDependencies`, `optionalDependencies`, and `peerDependencies`.

## Exact current lock-root set

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

Measured: `15` paths present. Lock roots are parsed as Bun v1 workspaces; `file:` edges resolve to their literal local manifest paths.

## Pre-mutation SHA-256 identity

The following hashes were measured before this receipt was written. They are the byte identity for the source census; evidence files are not part of the product rollback boundary.

```text
manifest collab-electron/package.json B300884279EBEECE290959EE0595B148BBD33BC56315E9EE64C549948406DCB1
manifest collab-electron/packages/components/package.json D779A2F589CB41813EF646A099A2A1625F260F92608F31E9D7BB3A34F4DAADDF
manifest collab-electron/packages/shared/package.json 0EC600234B8A9AF86A3EEDD07FBC3A130BED54E122F7581A580325FA590A8571
manifest collab-electron/packages/theme/package.json D8ADBAB198FD992508A8E4C64F862D38A5B4071DEB8D125CC8AC74500CDFFBBA
manifest packages/qf-kernel/package.json DB03BA543472796A4E9F744EC9BE7B5AE0E845666254039BED2F5431BE68841F
manifest qf-kernel-schema/package.json 839426DD9C6D4ABDFD3C427AC109A296A7B9BCC8FFB645C466C908D2D0EAEF5B
manifest species/hermes/package.json 7176299AF998FA36287C37243181DE83264262296968E638C92D37D6C086162B
manifest species/hermes/agent-package/package.json 70A5608BEF041CBA3DF3D04AC4AB02B3191A2321E2DCBC81FFEED1A5948E28F0
manifest tools/qf-bovada-football/package.json 8DAA40DE1C52340BB16E3526FE8931AE6AB29B2D0AF9ADEBB36917F47E1EBAD5
manifest tools/qf-proof-agent/package.json B648DC12113EC01C16B423D72BE87AB29D69437009C1485F7194685FE9DEDAEF
manifest tools/qf-read-tools/package.json F7A8521F3CF078D28491B50B47C0C57B15B60A5C347D5A74A5E8C86C9F1516FD
manifest tools/qf-vault-projection/package.json 8603CCC757A4B49F5DC54C92406A5BA135BE38745E6B5F820246B54ADFB133A7
manifest qa/fixtures/lifecycle-command/package.json BF51F5F2459795CEB43F343C6350EE7DC54DC7FC5D7EC39E3FB2AE7CCA90F403
manifest qa/gates/artifact-root/package.json 0609E0F52CD42AC0A03603B2BDB120ABC2B9C4CBAD9DCA7094A98D570CC34F79
manifest qa/gates/boot-reconcile/package.json A8D40DC7705B3F9383D09091CDA9F73A0363B0216E11BD00A28D991336450EFD
manifest qa/gates/bovada-football/package.json 830EEDA7E3442ADBBA03631263D21BAD052288B3F15291A04EB43A858E15E418
manifest qa/gates/dock-definition-launch/package.json 5A686805862036480DAA4714DA0C9B2605FB82F675813811B8643011B843F818
manifest qa/gates/dock-profile-identity/package.json 7A8A94EE476910AADBC1314188C61D2F3C15B8B910DFA5F2201EA0C03C35A889
manifest qa/gates/kernel-drift/package.json 3971F54A2A1A87CFDFC15C48DE2255853F288609EE985EC9E2FAA4E4B5C4FED2
manifest qa/gates/market-ingest/package.json CB681D73D0C3B2A39E7E4D57E083D08E11E8588A1B09A034D1070B9AD84D
lock collab-electron/bun.lock 4A498B47E59A2A772791B936CAF67A94FF96D9456184C0E3974F49010E8B7F7E
lock packages/qf-kernel/bun.lock D0FB23A60650B1C419343FE51A3DE306730043DDEE5C6FAFA35EE5EE6BCE8202
lock qf-kernel-schema/bun.lock 69AF75CD62233D8508D9561053FC4B1028FAE6D6782EDC192BB92ADD090054A9
lock species/hermes/bun.lock 4075F5F235DE754ECDD5E0B70C4BF6D8486D1366ADD1169086261CA9FDF5475A
lock tools/qf-bovada-football/bun.lock 007F704BD69D37175794BFE62880C80B6C85965EE15CF9B948F7435CDF29C013
lock tools/qf-read-tools/bun.lock 12756DD6D77E7CD01FCE0FB64684C9FF154CE35FAE9831F305FE1DE34C87188D
lock tools/qf-vault-projection/bun.lock E1107C737F4A244E466F85227F641E66915EC3C2B0A4241F3CD3610E6DFD4C45
lock qa/fixtures/lifecycle-command/bun.lock A88C2E664F283D7E9E79E14078009CB793CCD8B56F478F601853E663D020D4E7
lock qa/gates/artifact-root/bun.lock 8A994D01C0E1D2547D74BC1A97261ACB1228ECBF970E75AC1AAE901B129AFE21
lock qa/gates/boot-reconcile/bun.lock FB9DF90B444469008C36E87A9D48B294A115A5863607AB0FF7062770EE583655
lock qa/gates/bovada-football/bun.lock E34C9452870D4C9001BA5F9200FA8DD8BA7A6A4B7CA37E352535C829CBFA9846
lock qa/gates/dock-definition-launch/bun.lock A3047A70B25CE123E56A0CD0EF49C09EBE554DA996E50E53567D004223F02B47
lock qa/gates/dock-profile-identity/bun.lock F8F00C3A7B8ED179EA4A646AE4BB6A07066B193F1F3C840F8748D5AF7CF71F9F
lock qa/gates/kernel-drift/bun.lock 2AF28B1C732C5ACADBD4FC7A47A1FF623BDE881946502CD0D164C9F765E138A4
lock qa/gates/market-ingest/bun.lock 63C465C8905D33FFBC28A41865DA4F6C96469BE206532CCB01B49505DA6D1F80
```

## Protocol boundary and starting classifications

The exact two preload bridges and 16 associated main/type/caller files are the 18 paths named by the Reader baseline. The two PTY rows are distinct protocol variants: `ipcRenderer.send` is current and protected; only the unconsumed `ipcMain.handle` half is eligible for contraction.

| finite rows | starting disposition | proof required |
| --- | --- | --- |
| four browser handlers and five broken Canvas calls | routed to G10 / retained | no G7 deletion or repair; preserve the live caller/defect |
| `agent:spawn`, `agent:prompt`, `agent:cancel`, `agent:kill`, `agent:save-messages` invoke residue | removal candidate | exact zero current/dynamic/package/compatibility/QA/future census |
| `openFolder`, `openImageDialog`, `countFiles`, `getHomePath`, `openSettings`, `openExternal`, `workspaceRemove`, `updateFrontmatter` | removal candidates | zero caller plus retained neighboring APIs and startup/package proof |
| `deleteConnectionsForTile` | retained | live `tile-manager.js` consumer |
| `getGovernedReviewProjection` | retained | protected R16/G10 review projection surface |
| `permissionDecision` | retained | live session-tile/host-ACP permission path |
| `shell:loading-status` | retained/investigate | renderer listener is current; no sender found; no dynamic producer may be assumed |
| `shell:forward` transport, 20 static inner channels, `agent:${event.kind}`, `viewer:${msg.workspacePath}` | retained | exact tuple, sender parameters, buffer/replacement listener, and renderer routing |

All current dependency rows begin `PENDING` in the literal ledger. The source census found positive current consumers for the Kernel/schema/domain, PTY/watcher/image/build/runtime, React/Canvas/viewer/editor, Hermes host-ACP, qf-proof, QA, and updater surfaces. The only direct rows entering the removal candidate set are collab-electron's unused package declarations `app-builder-bin`, `class-variance-authority`, `clsx`, `streamdown`, `tailwind-merge`, and `use-stick-to-bottom`; `@types/d3`, React type packages, `@electron/rebuild`, and package/runtime/platform roots remain retained despite weak literal search because the compiler or lifecycle/package surface consumes them.

## Dependency closure method

The exact 20 manifests and 15 locks are the only roots. Each current dependency-section row is a root; Bun importer entries resolve exact versions; `file:` references resolve to literal local manifests; package tuples contribute `dependencies`, `optionalDependencies`, and `peerDependencies` edges including platform branches. The post-candidate closure is the union reachable from retained declaration roots and retained runtime/resource roots. A removed lock entry is legal only when it lies in the exact removed closure; every survivor must remain reachable. No version update, reformat, or unrelated lock churn is authorized.

Retained identity is G6 P1's eight Hermes paths plus Q1's three qf-proof controls and two qf-proof runtime files. Native packaging, installer/signing, Windows qualification, and full package requalification remain G12.

## Saved-state, compatibility, and process baseline

The finite matrix covers only Dock/host-ACP, session, research, terminal/PTy, Canvas, Dock invalidation, generic external CLI, and host-ACP. The canonical Kernel database was not opened or changed; the predecessor fixture is disposable only. Required readbacks remain preservation-only, with no migration, deletion, blocklist, or new UI truth store.

Pre-mutation process count: `bun=0`, `electron=0` in the builder checkout. Codex-host Node processes are not G7-owned processes. The temp directory already contains thousands of historical `qf-*` roots from prior orders; they are inherited and explicitly not G7-owned, so no cleanup was attempted. G7 starts with no owned temporary root.

## Starting matrix receipts

| command | result |
| --- | --- |
| `bun qf-atlas/generate.mjs --check` | `qf-atlas: current — 403 files, 124 channels, 20 strip candidates` |
| `bun qf-atlas/ratchet.mjs` | `baseline: 3 entries · HARD RED: 0 · unexplained coverage: 0 · undecided w/o blocker: 0 · AMBER (visible, non-blocking): 28 · undecided: 49` |
| `bun qa/run.ts repo-shape` | `PASS` |
| `bun qa/run.ts doc-links` | `PASS` |
| `bun qa/run.ts rung-ladder` | `PASS` |
| `bun qa/run.ts golden-g7-protocol-dependencies` | expected pre-implementation failure: `No gate named` |
| `bun qa/run.ts kernel-sole-writer-app` | `PASS` |
| `bun qa/run.ts dock-production-inventory` | `PASS` |
| `bun qa/run.ts golden-g5-consumer-census` | `PASS` |
| `bun qa/run.ts golden-g5-saved-state` | `PASS` |
| `bun qa/run.ts dock-definition-launch` | `PASS` |
| `bun qa/run.ts research-director-front-door` | inherited red: Windows process snapshot `Get-CimInstance` access denied; its internal falsifiers still reported red as designed |
| `bun test collab-electron/src/main/integrations.test.ts` | `12 pass, 0 fail` |
| `bun test collab-electron/src/main/launcher-readiness-pty.test.ts` | `1 pass, 0 fail` |
| `bun test collab-electron/src/windows/shell/src/canvas-rpc.test.ts` | `7 pass, 0 fail` |
| `bun run --cwd collab-electron build` | sandbox run denied access; host-permission rerun reached the real Electron/Vite build and transformed main/preload/renderer successfully; no product mutation |
| `git diff --check` | `PASS` |

The G6 inherited reds remain outside G7: G8 owns `kernel-one-path`; G12 owns the package-inspect Windows fixture failures and Hermes WSL `E_ACCESSDENIED`. The process-snapshot access red is likewise inherited environment/operations evidence, not a G7 repair target.

## Stop boundary

No G8–G12 work, R18 work, schema/Kernel/write-path change, native packaging pin, installer/signing change, user-data change, new truth store, browser/Canvas repair, or evidence-only self-approval is included in this builder run.
