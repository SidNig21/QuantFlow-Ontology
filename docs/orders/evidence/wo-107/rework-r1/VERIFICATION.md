# WO-107 verification round 1 — REWORK

**Plain-language result:** the release passes every automated check, but the finished Linux app
crashes before it can open its database, so it cannot capture Bovada data or hand that evidence to
Hermes.

Date: 2026-08-02

Verifier target: `2fb7ec137b0b4853c4480994c180589645ec80c2`

Continuation branch: `codex/wo-107` at handoff commit
`eea72e8efadbceb151454308086631d7d2347703`

Environment: WSL2, Ubuntu 24.04.4 LTS, Bun 1.3.14

## Canonical release verification — PASS

The verifier started from a fresh detached worktree at the exact product-and-gate commit and ran
the canonical command once:

```text
bun qa/verify-release.ts
```

Run ID: `7c13c231-f4dd-4cb9-9aa0-abe3cb6627a1`

Exit: `0`

Final line: `PASS  release-verification`

Transcript: [`canonical-release.txt`](canonical-release.txt)

Transcript SHA-256: `a312cafafa1cecbc728ad465ab338c7cc224bb9d4fd09c2e95e67694edab91ae`

The same run produced the finished Linux package later used for D5. Relevant package hashes:

```text
quantflow       48b9296550bd10c89aead3d01ec510dad60b36ea9fa65aa5cf6b9e99bddfe67c
app.asar        e46988e12027696daab475e50550649b1ad852e5e822d470444b32b2fdb56642
collab-cli.mjs  7ed1a81bcc8062c5ba4f17668261a474dc9a6ad4edfa076a77d600b904f10d1b
```

## Required five-bait falsification — PASS

The verifier ran the fixture-only mutation gate directly after the canonical run. All five
independent mutations went red and each exact production restore went green:

1. caller credential/origin escape — RED → GREEN;
2. Kernel publication before durable source — RED → GREEN;
3. removed pre-game selector predicate — RED → GREEN;
4. stable Venue reissued instead of read-classified — RED → GREEN;
5. staging cleanup removed — RED → GREEN.

Final line: `PASS bovada-football five-bait mutation gate`

Transcript: [`five-baits.txt`](five-baits.txt)

Transcript SHA-256: `81fed8b1a23bca84250654853f48b92adee7b3f4e2ac429ceac0be08e4389711`

## D5 packaged live proof — blocked before capture

Fresh absolute stores were prepared:

```text
QF_KERNEL_DB=/home/rybowen21/wo107-d5-20260802/kernel.db
QF_ARTIFACT_ROOT=/home/rybowen21/wo107-d5-20260802/artifacts
```

The finished package from the canonical run was launched under WSLg with those paths. WSL requires
the unpacked Electron package's non-setuid sandbox to be disabled, so the launch used the standard
`--no-sandbox` runtime flag; this does not affect the JavaScript path failure below.

The main process failed before `openAppKernel()`, JSON-RPC startup, or any vendor request:

```text
TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
    at join (node:path:1339:7)
    at .../resources/app.asar/out/main/index.js:9509:28
```

Mechanical state after termination:

```text
kernel.db exists: false
artifact files: 0
socket-path exists: false
```

Packaged runtime log: [`packaged-app.log`](packaged-app.log)

Log SHA-256: `4064b2ce3e41da02f5d220583ff31c5b4b5bc13d4c2ae74cda2dd11129f0470f`

No capture receipt, Kernel graph, Artifact hash, or Hermes transcript exists because the packaged
application never became operational. No source-tree runner or mock was substituted.

## Numbered REWORK finding

1. **High — the finished Electron app cannot boot.** `qf-kernel-schema/src/schema.ts:167` resolves
   `schema-baseline.json` with `join(import.meta.dir, ...)`. `import.meta.dir` is a Bun extension;
   the production Electron main process runs on Node and the bundled expression receives
   `undefined`. The canonical verifier proves package closure but does not launch far enough to
   detect this. Required rework: make this production path resolution Node/Electron-compatible,
   add a packaged-runtime gate that reaches Kernel and JSON-RPC readiness, then independently repeat
   the canonical run, five baits, and the full packaged Bovada-to-Hermes D5 proof.

## Judgment

Verification stopped at the first blocking D5 failure. The verifier did not redesign WO-107,
start WO-109, add platform work, patch builder code, read credentials, or merge. Continuing through
a source runner would have replaced the required shipped-product proof with a different product and
would have hidden the defect.
