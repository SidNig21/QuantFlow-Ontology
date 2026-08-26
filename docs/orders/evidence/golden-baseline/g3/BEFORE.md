# Golden Baseline G3 — Frozen starting evidence

status: **frozen before mutation**
build-base-sha: `93b4fb596f0d248cbc0306e68e97226428ed22e7`
upstream: `origin/wo-golden-g2` = `93b4fb596f0d248cbc0306e68e97226428ed22e7`
branch: `wo-golden-g2`
starting-tree: `d48c086f371084eced14d6b8a91db0ecd1e3ebaa`
product-process-count: `0`

In plain terms: the two obsolete standalone islands are still present here, while the app-owned notification transport and `hermes-critic` are separate current product seams.

## Starting checkout receipt

The checkout was clean apart from the three preserved, untracked G3 census inputs:

```text
docs/orders/evidence/golden-baseline/g3/IGNORED-DESCENDANTS-BEFORE.tsv
docs/orders/evidence/golden-baseline/g3/REFERENCES-BEFORE.tsv
docs/orders/evidence/golden-baseline/g3/TEMP-ROOTS-BEFORE.txt
```

The product-process scan found zero `electron|bun|node|hermes` processes whose command line referenced this repository. The unrelated Obsidian and MCP service processes were not product processes. The ignored-descendant manifest contains 20,052 literal paths under `tools/qf-peer-bus`; the critic-mock root had no ignored descendants in the preserved manifest.

## Exact tracked deletion manifest

All bytes were measured at `BUILD_BASE_SHA`. These are the only tracked files authorized for deletion.

| path | bytes | SHA-256 |
|---|---:|---|
| tools/qf-peer-bus/.gitignore | 20 | ba79bbc25fa8951489e77f28f1561c2e9388115cb33f1c606424f8e08169f96b |
| tools/qf-peer-bus/README.md | 6928 | ee5a8427818534d074e16e7cd3537b41a49361a3dce1fe6395a30120850e9a22 |
| tools/qf-peer-bus/bun.lock | 20383 | 7b4a635f463cfd743850928de8e323e0363bba6e4bc46816bca47b7edb08981c |
| tools/qf-peer-bus/package.json | 529 | f85bc60b8823222459a2e314e59a32e3c522cebdb5205a4a0abf871610fb9882 |
| tools/qf-peer-bus/tsconfig.json | 357 | 7d26466b25237b8c0a3a73cef2ccc3d151e5cf1dbe7bb5c5aa2c5395ff4fa3e7 |
| tools/qf-peer-bus/scripts/setup-founder-seats.ts | 8668 | f44ca2aaf83d9a2b31de6c9d742d7e569a5689246de68d2c39210f1451d4451f |
| tools/qf-peer-bus/src/bus.ts | 6394 | 9c291b20eec8d9c60738dbd51740ced697983b7047dc0a53bb3d4df08ff32532 |
| tools/qf-peer-bus/src/harness.ts | 13211 | 7e13e92b019d82466c47be9c900c683784caac3079afaf6764cdc134cef0e826 |
| tools/qf-peer-bus/src/server.ts | 3687 | 25e81f3162f6e8ddab2870aa885be5a172767a7757940286e01f02355cccf3a1 |
| species/critic-mock/.gitignore | 82 | 0898881cd11f51a2506072c7c433f9fbeeecd9579b33f6b6258b5c12e803da83 |
| species/critic-mock/README.md | 479 | 44765b3ea902b61a6fb4a2ed1902668da736f7e5f497f124ff503f8794bb4183 |
| species/critic-mock/agent-package/agentos-package.json | 250 | 0af5fd6e5167b010b92c9d496c30ac26f8717921866afddeedc5bd0d71b39cda |
| species/critic-mock/agent-package/package.json | 256 | 560adc34f66954eb027bb46144ad64495b0b31ebfcb1fde1d3d8a60c37728cd7 |
| species/critic-mock/agent-package/src/acp-main.ts | 6092 | f7b078f0383405e48118e36481c5cf23906a2bdb6a3e36e3c4be161bcf2b9b90 |
| species/critic-mock/bun.lock | 4497 | b0db786c3ae2c905740779875b5cf3592a05cca0478b0abd604cb4f51e795cda |
| species/critic-mock/evidence/dock.png | 34246 | 3deb68cb1ed4932738551eceef32f72df8021459648ad58993bb7248c33cd83a |
| species/critic-mock/package.json | 470 | 7a5ccb20f46dff947172fbd10d79ece54392a85350530f1f2001db853ea5cdb0 |
| species/critic-mock/register.ts | 1482 | 0c816cdb11ec98efebe3e0cbd15950f1ac7e34fc153b558830709c912f0376b0 |
| species/critic-mock/scripts/pack-agent.mjs | 1570 | fb2bca6ea8c70145b4548ebc1b535ca8311a57d4cdcb4108b83aff92817cd462 |

Ignored descendants are preserved verbatim in [IGNORED-DESCENDANTS-BEFORE.tsv](IGNORED-DESCENDANTS-BEFORE.tsv), SHA-256 `39affcbb8729d3d1971a349b08577b948d2a7be423303c4254b595ebb26d0247`. The completed reference census is preserved in [REFERENCES-BEFORE.tsv](REFERENCES-BEFORE.tsv), SHA-256 `74db94a56f5fcf94d4a55476d168bc13d08afe63d047240ab5f56759891fd71d`.

## Consumer census classification

The preserved census covers exact imports, spawn/launch routes, runtime inventory, Dock manifests, Electron `extraResources`, package references, build output, installer inputs, compatibility/state, QA, current authority, history, generated output, comment/string mentions, and R18–R25 references. The active order excludes its own `docs/orders/evidence/golden-baseline/g3/**` output root. `NEXT.md` and this order are control documents, not executable consumers. QA, generated output, accepted historical evidence, and comments/strings are recorded separately and do not justify retaining either island.

Package-local declarations measured before deletion:

* `tools/qf-peer-bus`: `@modelcontextprotocol/sdk`, `qf-kernel`, `zod`, `@types/bun`, and TypeScript.
* `species/critic-mock`: `@agentclientprotocol/sdk`, `ai`, `qf-kernel`, `zod`, `@rivet-dev/agentos-toolchain`, and `@types/bun`.

No shared root/app dependency was removed by this freeze. The app-owned `QF_PEER_BUS_DB`, `.qf-peer-bus` compatibility directory, transport schema/migration, `peer-delivery.ts`, Agent Host/native TUI, Windows/WSL forwarding, governed review, independent-critic tests, and `hermes-critic` remain outside the deletion manifest.

## Starting matrix

Command outcomes below were measured before product/QA mutation. The three lifecycle selector reds are deliberate controls against the old peer-bus manifest. The new G3 census and one-path bait selectors did not exist at the frozen SHA and are therefore `not-yet-implemented`, never claimed green.

| command/control | exit | starting result | assignment |
|---|---:|---|---|
| `QF_TYPECHECK_FALSIFY_RECURSIVE_INSTALL=literal bun qa/run.ts typecheck` | 1 | expected forbidden lifecycle, old `tools/qf-peer-bus` | G3 control |
| `QF_TYPECHECK_FALSIFY_RECURSIVE_INSTALL=flagged bun qa/run.ts typecheck` | 1 | expected forbidden lifecycle, old `tools/qf-peer-bus` | G3 control |
| `QF_TYPECHECK_FALSIFY_RECURSIVE_INSTALL=chained bun qa/run.ts typecheck` | 1 | expected forbidden lifecycle, old `tools/qf-peer-bus` | G3 control |
| `bun qa/run.ts typecheck` | red / timed out during Windows dependency work | pre-existing Windows `node-pty`/dependency EBUSY condition; checkout remained unchanged | assigned under ADR-0004; G12 if package/filesystem hardening is required |
| `bun qa/run.ts kernel-one-path` | 1 | 12 pre-existing QA fixture `kernel.db` literal offenders; no G3 bait existed | assigned G8; G3 must prove its delta without absorbing this red |
| `bun qa/run.ts kernel-sole-writer` | 0 | PASS | inherited regression |
| `bun qa/run.ts kernel-sole-writer-app` | 0 | PASS | inherited regression |
| Atlas falsifier receipt | 98/98 | `HARD RED 0`, tree-neutral baseline receipt | inherited exact-SHA receipt; no broad census rerun |
| `bun qa/run.ts golden-g3-consumer-census` | not-yet-implemented | no G3 gate existed | G3 deliverable |
| `QF_KERNEL_ONE_PATH_FALSIFY=1` | not-yet-implemented | no G3 selector existed | G3 deliverable |
| windows-dock-collaboration package run | timed out, then cleaned | no product process remained | assigned under ADR-0004; G3 non-regression required |

The existing Atlas projection records 432 files, 126 channels, and 13 strip candidates. Starting generated artifact hashes are: `atlas.json` `4fd9906d156abb821a2fa54227a2ba67dbdd5f2b27e92f1138ef138c2580e591`, `ATLAS.md` `c5904df74710fad84de65515560c1717106364c99dcb59e71c05ab852e3cbe8c`, and `atlas.html` `853f5bb5149c39c76fca1d49feaa2e4b675d0172f762f8694d294b639b0d6c3c`. The frozen source tree hash is `d48c086f371084eced14d6b8a91db0ecd1e3ebaa`.

No app-owned transport or governed-review behavior is inferred from the standalone package evidence; those seams are separately preserved and must be re-proved on the candidate.
