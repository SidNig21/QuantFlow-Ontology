# G8 builder freeze — pre-mutation baseline

Plain language: this receipt records the checkout, source census, saved-state identity, and first G8 matrix before any repair was made.

## Authority and checkout

| item | value |
| --- | --- |
| order | `docs/orders/WO-GOLDEN-G8.md` |
| builder authority | `c7cc7f4ad69c4e0c484ee5b71ed2e543837506e5` / tree `11899c691f3af253d88f0f4e4ff6b5db916f0663` |
| semantic Reader authority | `baedcecd55b91dc3c5d951f969a2111d5cedf4d2` / tree `33695d1ac5a53b56077bbf739d94e6e230d6533b` |
| final Reader task | `01a04716-ef0f-72d1-aaa1-be295596f893` |
| current branch | `wo-golden-g2` |
| current HEAD | `c7cc7f4ad69c4e0c484ee5b71ed2e543837506e5` |
| current HEAD tree | `11899c691f3af253d88f0f4e4ff6b5db916f0663` |
| pre-mutation status | clean; no tracked or untracked changes |
| frozen Phase-1 authority | `5882ab2febf00f2c15a94c868c191420ed561bb4` |

The delegated instruction was followed: the existing checkout was used without switching branches, creating a worktree/copy, pulling, or pushing.

## Frozen denominators

| set | measured value |
| --- | ---: |
| current Electron/package manifests | 20 |
| direct dependency declaration rows | 109 |
| current Bun lock roots | 15 |
| kernel-one-path offenders | 13 |
| experimental lifecycle declarations | 89 |
| Law-B support-write authority set | 20 named doors |

The dependency denominators are the G7-owned, currently measured sets. G8 does not change their dependency content.

## Starting matrix disposition

| command | exit | starting result | G8 disposition |
| --- | ---: | --- | --- |
| `bun qa/run.ts repo-shape` | 0 | PASS | current-group green |
| `bun qa/run.ts doc-links` | 0 | PASS; 81 live documents | current-group green |
| `bun qa/run.ts rung-ladder` | 0 | PASS; 27 rungs, active R18 | current-group green |
| `bun qa/run.ts kernel-one-path` | 1 | exactly 13 named K1 offenders | G8 repair target |
| `bun qa/run.ts kernel-sole-writer` | 0 | PASS | current-group green |
| `bun qa/run.ts kernel-sole-writer-app` | 0 | PASS | current-group green |
| `bun qa/run.ts governed-review` | 0 | PASS; 14 focused tests | current-group baseline |
| `bun qa/run.ts hermes-first-turn-synthetic` | 1 | Windows Electron/Vite access denied during build | inherited G12/package environment red |
| `bun qa/run.ts golden-g7-protocol-dependencies` | 0 | PASS; manifests=20, dependencyRows=103, lockRoots=15 | current-group green |
| `bun qa/run.ts golden-g8-kernel-proof` | 1 | No gate named | G8 registration repair |
| `bun qa/run.ts golden-g8-schema-lifecycle` | 1 | No gate named | G8 registration repair |
| `cd qf-kernel-schema; bun test` | 0 | 179 pass, 0 fail, 615 expect | current-group green |
| `cd qf-kernel-schema; bun run generate` | 0 | generated artifacts unchanged | current-group green |
| `bun run --cwd collab-electron build` | 1 | Windows Electron/Vite access denied during build | inherited G12/package environment red |
| `bun qf-atlas/generate.mjs --check` | 0 | map current at starting tree | current-group green |
| `bun qf-atlas/ratchet.mjs` | 0 | HARD RED: 0; unexplained coverage: 0 | current-group green |
| `git diff --check` | 0 | clean | current-group green |

The two missing G8 gate names are an unimplemented G8 surface, not an inherited later-group failure. The Electron build failure is recorded as inherited because the same access-denied failure occurred in both the packaged gate and direct package build before mutation; it is not a G8 semantic result.

## Exact K1 paths at freeze

```text
packages/qf-kernel/src/r11a-deterministic-execution.test.ts
qa/gates/dev-dock-readiness.ts
qa/gates/founder-steering.ts
qa/gates/kernel-sole-writer-app.ts
qa/gates/pre-r18-coherence.ts
qa/gates/r17-founder-kernel-compatibility.ts
qa/gates/r17-guided-technique-consumer.ts
qa/gates/research-director-delegation.ts
qa/gates/research-director-front-door.ts
qa/gates/research-world-visible.ts
qa/gates/team-composition-ui.ts
qa/gates/team-composition.ts
qa/gates/technique-outcome-loop.ts
```

## Pre-mutation SHA-256 identity

The following hashes were measured before this receipt was written. They are the byte identity for the source census; evidence files are not part of the product rollback boundary.

```text
packages/qf-kernel/src/r11a-deterministic-execution.test.ts 1F8F37AB2ABAFBBFE565F6E0CE3D9F390366B174039D072D1549415F9EF23CE3
qa/gates/dev-dock-readiness.ts 0271401C93763B668A7F80DCE7D678B7822CF6874B989DBE7148A96E6E4EE47E
qa/gates/founder-steering.ts FFE318FB2E25ED88FE8E3000BB09CEB04C03B99724FD524DC11C7A112EBE54C7
qa/gates/kernel-sole-writer-app.ts 7C56C531DA85BE7E1BAC17F40B75169099DFDE79E7680AB443345281C479EA24
qa/gates/pre-r18-coherence.ts 727E427C064322764DD98DF41B8C219088AF0E9607514C7F8FD9F2D2CBDA946F
qa/gates/r17-founder-kernel-compatibility.ts FF097C9D6002DD6A8334E7EBA88580CF14A31D9D0E330E1D5B77749C04501805
qa/gates/r17-guided-technique-consumer.ts E91EF2CCE7222EFC9F58CCFCEFEEBA5435D90E3D180DAACB5AD62DC520226F1D
qa/gates/research-director-delegation.ts 06E34638E557B5EA2A72FBB9D67B72983EBA8C46B632F7D6EEAC932B13ACCCDF
qa/gates/research-director-front-door.ts 58360CFA7B2CA64E3368DE5DAC265E30FF457A4AB9926D1BDDFB6E4CDFE2DAB1
qa/gates/research-world-visible.ts FD03207F7F086B3B41DD2B06FF6BA2C7EA2DDF0082802E65B300FAD43DDDCCD7
qa/gates/team-composition-ui.ts 42DF920B0A27108A6E9B40BABDCAC5CD78800204890E9C1C589F0681B11CEF18
qa/gates/team-composition.ts 7A0A764B385DC3C1AA83850A2D54A6F110D23FDAB9E9575AC016A9E30CEC413E
qa/gates/technique-outcome-loop.ts A167E6062A65EBA56A05EE8B8FCD923652F790D9DD5EE52C51216C7CF9B86599
qa/run.ts 4837D9649C17B04D7135504ED5EE86A06C361992FA78FCAEBD598FD949FCFA46
qa/gates/hermes-research.ts 12BAF37DDAFEEF1788DDA299A6F56A85CAB690151ACCA4BFF99C9E4E67C1B8DE
packages/qf-kernel/src/execute.ts F36F90681DE56DCB9C63E0406AD26D4F056AB6EEBBD1F7959E174E17D8A2955F
packages/qf-kernel/src/governed-review.ts B0E078E19E025C302ECB6BC293F2D66DA8969EC404631F15AA8D7871EAAA1218
packages/qf-kernel/src/index.ts 228571B65AC6D268F14D744D5388396826DADDB7F18E5FB1E41D64C000863B63
packages/qf-kernel/src/portable.ts 6BCFC17C88B60280DA3B9F3D65EB9FE15D38A64A019AAF19424DF52BBE55AE9C
qf-kernel-schema/src/commands.ts BBD269219703B74776EFBF5F5D14D5C3F80D42CFC12A188C1C7130DDBEC2FCB83
qf-kernel-schema/src/ontology/agent.ts 377E406FC2FCA990E5587C44DB97228B6BD61109E459F496279A6BD3582BA214
qf-kernel-schema/src/schema.ts FA10F838E4ACF0AFEAFD5B5EE198696586CF2BB6F3A79A30BCCD0B49ED0C7BB5
collab-electron/src/main/kernel.ts 7DCE55D305EB0D2F288F82EA7EEAE70F808A61E5A58360BCD34D4AE271989345
```
