# G2 Rework 1 before receipt

Plain-language meaning: the active repository carries eleven files that no current product path uses, so G2 removes only those leftovers while keeping the behaviors they used to describe covered by current checks.

## Immutable starting point

- `REWORK_BASE_SHA`: `b4b86d16b8cac0e80508d61eed8ba8d3785f3da4`
- `origin/wo-golden-g2`: same SHA
- accepted G1 ancestor: `8ebe35d7374ebca3752c94cf51a676a58e1ede62` (ancestor check exit `0`)
- pre-mutation `git status --porcelain=v1 --branch`: `## wo-golden-g2...origin/wo-golden-g2`
- Round 1 build base was `6f73e61f74dc5f438da90d92e3f1ed3a33586297`; its allowlisted proof, Atlas, and evidence diff was preserved after the Round 1 stop.
- Router staging correction restored all eleven targets byte-for-byte; Rework 1 revalidated the frozen manifest at this SHA before deleting the eleven targets exactly once.

## Frozen eleven-path manifest

The literal denominator returned `TARGET_COUNT=11`; every path was tracked and existed.

| path | bytes | SHA-256 |
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

## Entry, build, output and package census

The current Electron entry graph is declared in `collab-electron/electron.vite.config.ts`: five main inputs (`index`, `pty-sidecar`, `watcher-worker`, `git-replay-worker`, `image-worker`), two preload inputs (`universal`, `shell`), and ten renderer HTML inputs (`nav`, `viewer`, `terminal`, `settings`, `shell`, `terminal-tile`, `graph-tile`, `artifact-tile`, `session-tile`, `tile-list`, `agent-chat`). None selects an authorized target. `collab-electron/package.json` has no target in its build or resource declarations.

The exact order census used two declaration surfaces and the generated output tree:

| scan | files scanned | hits |
|---|---:|---:|
| `collab-electron/electron.vite.config.ts`, `collab-electron/package.json` | 2 | 0 |
| `collab-electron/out/**` after scoped `bun run clean` | 0 | 0 |

The only pre-census hit was a stale untracked `collab-electron/out/tsconfig.node.tsbuildinfo`; the order-authorized scoped Electron clean removed generated `out` and `dist`, after which the exact census was zero. No tracked file was changed by that cleanup.

Package-resource inspection is live only through `collab-electron/scripts/package-lib/package-inspect.ts`, `runtime-staging.ts`, and the current Dock/profile resources. Its source references are to current `package-resource-paths` helpers; no package resource selects any frozen target. The two old species reads were QA-only static subjects and are retargeted in D2.

## Literal references and disposition

The literal sweep excluded generated Atlas projections, historical evidence, `out`, maps, and dependencies. It found only the following non-authority references:

| reference | kind | disposition |
|---|---|---|
| `qa/gates/artifact-root/run.ts` imports `a2a-artifact-store.ts` and contains A2A bus/store assertions | QA assertion | remove the retired A2A exercise; preserve the production writer, root, hash, storage, install-plan, and exhaustive publisher checks |
| `collab-electron/scripts/package-lib/shared-paths.test.ts` reads `species-launch.ts` and `species-tools.ts` | QA static assertion | retarget to `host-native-tui.ts` and `runtime-adapter.ts`, with named-import/call checks |
| `qa/gates/one-skin.ts` allowlists `cube3d.js` | QA allowlist | remove only this deleted-file exception |
| `qf-atlas/decisions.json` contains four source-bound decisions | human Atlas fixture | preserve exact prior text in G2 evidence, then retire the entries and update the ledger comment |
| `qf-atlas/falsify.mjs` uses the old A2A subjects for falsifiers 42/43 | Atlas falsifier fixture | retarget 42 to the Dock external anchor and 43 to a temporary unreachable product file plus QA assertion string |
| `qf-atlas/generate.mjs` and `qf-atlas/reach.mjs` contain A2A-specific explanatory comments | comments only | update wording only; reachability semantics remain unchanged |
| imports among the frozen source files (`a2a-orchestra` → `a2a-bus` → store; `species-surface` → `species-launch`) | intra-residue edges | disappear with the exact deletions; no surviving production consumer was found |
| `species/hermes/a2a-core.ts` error strings and historical docs/orders | string/history | not product consumers; excluded from active census or retained as history |

No production Dock profile, runtime route, preload bridge, main entry, renderer entry, or package resource selects an authorized target. The only current live references are the named QA/Atlas subjects above; no other runtime/build/package consumer was found.

## Current invariant mapping

The obsolete R13 check exercised a sample question-to-report path: Mission/session admission, Dataset/Hypothesis/Run creation, immutable Artifact publication, critic Evaluation, final Report, and a complete ledger projection. Its exact current protections are:

| superseded question or assertion | current receipt |
|---|---|
| Mission and Director admission/session path | `bun qa/run.ts research-director-front-door` |
| Dataset → Hypothesis → Run → Artifact → Evaluation → governed Report lineage, including empty/fabricated-lineage baits | `bun qa/run.ts kernel-market-lineage` |
| strict evaluation/publication/refusal and replay behavior | `bun qa/run.ts governed-review` |
| current research-world object/link projection | `bun test qa/gates/research-world-visible.test.ts` |

The charter is a manual cold-read fixture about research ontology descriptions: supporting evaluations are identified by `evaluation.verdict === "supports"`, while the schema cannot express which evaluation authorized a report. This meaning remains protected by the lineage, governed-review, and research-world receipts above; no active fixture replacement is authorized. The two design specs are historical/manual evidence only and have no executable or boot-authority role.

## Pre-mutation process receipt

The exact order process census returned `PROCESS_COUNT=0`:

```powershell
@(Get-CimInstance Win32_Process | Where-Object {
  $_.Name -match 'electron|hermes|wsl|node|bun' -and
  $_.CommandLine -match 'QuantFlow-Ontology|qf-atlas|hermes'
})
```

The pre-mutation build/package scan and process census are recorded in `logs/before-census.txt`.
