# G7 Reader baseline — literal denominator, protocol, state, and closure contract

status: **AMENDED CONTRACT / FRESH SEMANTIC READER PENDING**
order: `docs/orders/WO-GOLDEN-G7.md`
reader-defect-task: `01a046b4-c6e5-7d41-8983-dafbf408f4df`
reader-approved-source: `8dbc19162be9c42303fd79c3c942385a17726f31`
reader-approved-product-tree: `7cee1e3d8e8444d48c8048f344f44ef33db594e2`
reader-approved-evidence-head: `4e037c69268ffd4a62f0e9aa933686c6f8c3c93e`
phase-1-source: `5882ab2febf00f2c15a94c868c191420ed561bb4`

This is a frozen evidence contract, not Builder authority. It records the
finite set that a future G7 candidate must close. A blank, invented, or
variable subset is a failed candidate; every ledger row must finish as
`removed`, `retained`, or an explicitly routed out-of-scope defect with named
proof.

## Denominators and reconciliation

The historical Phase-1 numbers are provenance only. G7 gates evaluate the
frozen current set below, measured from the immutable G6 product tree before
any G7 source mutation.

| denominator | Phase-1 historical provenance | current G7 evaluated set |
| --- | ---: | ---: |
| tracked files | 1,150 | not a G7 deletion denominator; remeasure exact candidate tree |
| direct dependency rows | 153 | 109 rows in the four dependency sections of 20 manifests |
| Electron package declarations/hooks | 19 | 20 tracked `package.json` manifests |
| bounded operational roots | 40 | 15 tracked `bun.lock` roots |

The 44-row change is reconciled, not inferred from a count:

| group | manifest/lock path changes | direct-row accounting |
| --- | --- | ---: |
| G1 | none | 0 |
| G2 | none | 0 |
| G3 | added `qa/fixtures/lifecycle-command/package.json` and `bun.lock`; removed the two `species/critic-mock` roots and the `tools/qf-peer-bus` root | -13 + 1 = -12 |
| G4 | removed `qa/gates/agent-path`, `qa/gates/dock-registry`, and `tools/runtime-proof` manifest/lock roots; modified the collab manifest/lock | -26 |
| G5 | modified the collab manifest/lock; removed two ACP dependencies, three Assistant UI dependencies, and one Assistant UI override row | -6 |
| G6 | removed `species/claude-code/package.json`; no lock or dependency row | 0 |
| **total** | **G1–G6 path history reconciled above** | **-45 + 1 = -44; 153 - 44 = 109** |

The G5 override is included in the historical row accounting because it was a
package policy declaration. The current 109 count is only the four current
dependency sections (`dependencies`, `devDependencies`,
`optionalDependencies`, `peerDependencies`); there is no current override
row. G1–G6 history is not a G7 candidate subset and cannot be silently
recounted.

The row-level reconciliation is:

```text
G3 removed
  species/critic-mock/agent-package/package.json#dependencies: @agentclientprotocol/sdk, ai, zod
  species/critic-mock/package.json#dependencies: @agentclientprotocol/sdk, ai, qf-kernel, zod
  species/critic-mock/package.json#devDependencies: @rivet-dev/agentos-toolchain, @types/bun
  tools/qf-peer-bus/package.json#dependencies: @modelcontextprotocol/sdk, qf-kernel, zod
  tools/qf-peer-bus/package.json#devDependencies: @types/bun, typescript
G3 added
  qa/fixtures/lifecycle-command/package.json#devDependencies: typescript

G4 removed
  qa/gates/agent-path/package.json#dependencies: @agentclientprotocol/sdk, @rivet-dev/agentos-core, ai, qf-kernel, zod
  qa/gates/agent-path/package.json#devDependencies: @rivet-dev/agentos-toolchain, @types/bun
  qa/gates/dock-registry/package.json#dependencies: @agentclientprotocol/sdk, @rivet-dev/agentos-core, ai, qf-kernel, zod
  qa/gates/dock-registry/package.json#devDependencies: @rivet-dev/agentos-toolchain, @types/bun
  tools/runtime-proof/agent-package/package.json#dependencies: @agentclientprotocol/sdk, ai, zod
  tools/runtime-proof/package.json#dependencies: @agentclientprotocol/sdk, @rivet-dev/agentos, @rivet-dev/agentos-core, ai, zod
  tools/runtime-proof/package.json#devDependencies: @rivet-dev/agentos-toolchain, @types/bun, typescript
  collab-electron/package.json#dependencies: @rivet-dev/agentos-core

G5 removed from collab-electron/package.json
  dependencies: @agentclientprotocol/claude-agent-acp, @agentclientprotocol/sdk
  devDependencies: @assistant-ui/react, @assistant-ui/react-markdown, lucide-react
  overrides: @assistant-ui/store
G6 removed
  no direct dependency row; species/claude-code/package.json had no dependency sections

Lock roots
  G3 added qa/fixtures/lifecycle-command/bun.lock
     removed species/critic-mock/bun.lock and tools/qf-peer-bus/bun.lock
  G4 modified collab-electron/bun.lock
     removed qa/gates/agent-path/bun.lock, qa/gates/dock-registry/bun.lock,
     and tools/runtime-proof/bun.lock
  G5 modified collab-electron/bun.lock again
  G6 no lockfile change
```

The listed rows total 13 removed plus 1 added in G3, 26 removed in G4, and 6
removed in G5: 45 removed and 1 added, exactly the net 44-row reduction.

The exact current manifest paths are:

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

The exact current lock roots are:

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

The literal direct-declaration and protocol ledger is
`g7/CANDIDATE-LEDGER.tsv`. The Builder must copy it before mutation, add exact
consumer/compatibility/QA/future-rung proof for every row, and set every row
to `removed`, `retained`, or its named routed disposition. The Builder must
also write one decision per row: removal is allowed only when recreating the
surface later is cheaper than retaining it, while retention is required when
that proposition is false or any consumer remains. A no-op, blank disposition,
or variable subset cannot pass.

## `shell:forward` baseline at the approved source SHA

The transport is the main sender `collab-electron/src/main/ipc.ts:32-42`,
which emits `shell:forward` with dynamic `target`, `channel`, and payload;
the generic sender helper is `collab-electron/src/main/ipc-kernel.ts:77-84`
(`sendToShell(channel, ...args)`), whose current shell-forward call sites are
`ipc-kernel.ts:212-216,301,306-318,751-796,900`, plus direct senders in
`collab-electron/src/main/index.ts:925-960,1046-1058,1076-1078,1259-1268,1366`
and `collab-electron/src/main/session-canvas-projector.ts:10`. The preload receiver
and cold-launch buffer are `collab-electron/src/preload/shell.ts:38-43`;
the live receiver replacement is `:148-166`; the webview router is
`collab-electron/src/windows/shell/src/renderer.js:1404-1480`.

The exact inner-channel set at the approved source SHA is:

```text
agent:${event.kind}        (dynamic channel; sender ipc-misc.ts:206-210)
create-artifact-tile       (ipc-kernel.ts:212-216; index.ts:1262-1268, 1410)
create-graph-tile          (ipc-knowledge.ts:110-114)
create-term-tile           (ipc-kernel.ts:306-318; index.ts:1048-1058)
file-renamed               (ipc-filesystem.ts:134-145, 203-214)
file-selected              (ipc-knowledge.ts:71-72; index.ts:925-927, 1076-1078)
files-deleted              (ipc.ts:91-94)
folder-selected            (ipc-knowledge.ts:79-83)
fs-changed                 (ipc.ts:66-67; ipc-filesystem.ts:103-104, 191-192)
handoffs-changed           (ipc-kernel.ts:900; index.ts:1259, 1366)
nav-drag-active             (ipc-canvas.ts:44-48, 54-58)
open-browser-tile           (index.ts:957-960)
open-terminal               (ipc-knowledge.ts:91-95)
replay:data                 (ipc-misc.ts:159-163; dynamic target `viewer:${msg.workspacePath}`)
sessions-changed            (ipc-kernel.ts:301; index.ts:1046; session-canvas-projector.ts:10)
wikilinks-updated           (ipc-filesystem.ts:148-152)
workspace-added             (ipc-workspace.ts:315)
workspace-removed           (ipc-workspace.ts:333-337, 356-360)
spawn-failed                (ipc-kernel.ts:790-796)
spawn-pending               (ipc-kernel.ts:751-757)
spawn-reconciled            (ipc-kernel.ts:769-781)
```

The literal set has 20 static channels plus the one dynamic channel family;
the rows are frozen even when a sender has multiple sites. Every dynamic
sender/receiver must be named in the candidate receipt: `ipc.ts:32-42`'s
`forwardToWebview` string parameters, `ipc-kernel.ts:77-84`'s
`sendToShell` channel/payload parameters and its five call families, the
replay target expression at `ipc-misc.ts:159-163`, the agent-event channel
expression at `ipc-misc.ts:206-210`, preload's dynamic tuple at
`shell.ts:41-42,152-165`, and renderer routing through `viewer:*` and
`channel.startsWith("agent:")` at `renderer.js:1404-1445`.

Each channel gets an independent isolated bait named exactly
`shell-forward:<channel>`: remove only that channel from the bait source or
sender fixture, run the same consumer assertion, record exit 1 and the named
channel, restore the exact bytes, and rerun for exit 0. The dynamic family
gets separate baits for `agent:<event.kind>` and `viewer:<workspacePath>`;
the transport itself gets `shell-forward:transport`. Expected values may not
be read from the edited candidate source.

## Finite saved-state and consumer matrix

G7 tests only these touched seams. It does not claim that untouched state is
covered.

| seam | exact record/state and fields | readback assertion | bait |
| --- | --- | --- | --- |
| Dock profile / host ACP | Kernel `agent_definition`: `id`, `name`, `role`, `package_ref`, `system_prompt_ref`, `runtime_profile`, `capability_groups`, `display_name` | list and resolve the retained Hermes definition; package reference, route, role, and display name are identical; spawn resolves before runtime admission | remove one retained definition/package reference in an isolated fixture; resolver assertion exits 1 |
| session | Kernel `agent_session`: `id`, `created_at`, `status`, `label`; exactly one `spawned_from` link to `agent_definition` | create/read the session, assert link target and lifecycle status, reload list, and assert same id/definition; no direct SQL writer | remove the `spawned_from`/session consumer from the fixture; readback exits 1, restore exits 0 |
| research | Kernel `mission`: `id`, `name`, `objective`; `hypothesis`: `id`, `claim`, `success_criteria`, `sources`, `status`; `run`: `id`, `kind`, `status`, `params`, `trace_id`; `artifact`: `id`, `kind`, `content_hash`, `storage_ref` | submit the same research question, reload the mission/hypothesis/run/artifact references, and assert ids, kind/status, params/trace, and artifact hash/storage reference survive | remove the mission/session research consumer from the isolated predecessor; the same assertion exits 1 |
| terminal / PTY | Canvas `TileState`: `id`, `type`, `x`, `y`, `width`, `height`, `ptySessionId`, `sessionId`, `zIndex`; PTY event payloads `sessionId`, `data` or `exitCode` | save, reload, discover, and assert terminal tile identity/session binding plus PTY write/exit routing; both `ipcRenderer.send` variants remain present | remove the active send variant from the fixture; PTY assertion exits 1 |
| Canvas | `CanvasState.version`, `tiles`, `viewport.centerX`, `viewport.centerY`, `viewport.zoom`; tile optional refs `artifactId`, `sessionId`, `ptySessionId` | save through the existing atomic path, reload, assert version 1, tile ids/types/refs, coordinates, and viewport values; no new truth store | remove one touched field or load/save consumer in the isolated predecessor; exact assertion exits 1 |
| Dock invalidation | notification channel `qf:dock:invalidate`; projection trigger `shell:forward`/`canvas`/`sessions-changed` | session admission/close causes both Dock invalidation and Canvas session projection; readback then sees the same Kernel session | remove one notification in the bait; projection assertion exits 1 |
| external CLI | `AgentStatus`: `id`, `name`, `detected`, `installed`; integration input `agentId`; result `{ok}` or `{ok:false,error}`; sidecar session input `command`, `args`, `displayName`, `target`, `cwdHostPath`, `cwd`, `cols`, `rows`, result `sessionId`, `socketPath` | invoke the existing user-owned generic CLI path and assert the returned process/result contract and integration status fields; no G7 removal of this seam | remove its retained dependency/bridge from the isolated fixture; assertion exits 1 |
| host ACP | runtime route `host_acp`, `package_ref`, `runtime_profile`, session id, and done result `status`, optional `artifactId`, `text` | resolve/launch retained Hermes host-ACP, assert admitted Kernel identity, streamed completion, and durable artifact reference where produced | remove the retained ACP dependency/resource; assertion exits 1 |

The isolated predecessor fixture is one disposable copy containing one Hermes
definition, one starting session with its `spawned_from` link, one mission and
hypothesis, one run/artifact reference, one session tile, one terminal tile
with `ptySessionId`, the Canvas viewport, Dock invalidation, generic external
CLI request, and one host-ACP route. It is not the canonical Kernel database.
The same named assertion must be red under each bait and green after exact
restore; fixture teardown must leave no process, root, or database residue.

## Dependency graph, roots, closure, and package identity

The root set is the 109 literal rows in `CANDIDATE-LEDGER.tsv`, each keyed by
`manifest#section#package` and carrying its exact specifier. The graph is
computed as follows:

1. Parse only the 20 manifests and 15 lock roots above. Treat each current
   dependency-section row as a root; treat historical G5 `overrides` only as
   provenance, not a current root.
2. For each Bun v1 lock root, read its `workspaces[""]` importer entry and
   resolve every root specifier to its exact `packages` entry. Resolve
   `file:`/workspace references to the literal manifest path, never to a
   guessed package name.
3. Add directed edges for every encoded `dependencies`,
   `optionalDependencies`, and `peerDependencies` entry in each `packages`
   tuple, retaining platform/optional branches. Local package edges point to
   the local manifest root; registry edges point to the exact lock
   package/version entry.
4. The closure is the union reachable from all retained current declaration
   roots and all retained runtime/resource roots. A removal is legal only if
   its declaration and the entire now-unreachable closure have zero source,
   script, build/package-hook, QA, compatibility, named-future, and resource
   consumers. Every surviving lock entry must be reachable from a root; every
   removed lock entry must be in the exact removed closure.
5. Compare before/after root paths, importer keys, resolved versions, optional
   branches, and closure sets. No version update, lock reformat, or unrelated
   churn is permitted. A manifest/lock change is accepted only when its own
   closure is the exact consequence of a removed ledger row.

The retained runtime/resource identity is the G6 closure: production `P1`
is exactly the eight Hermes paths (`species/hermes/dock-profiles.json`,
`launch.json`, `packed/hermes.meta.json`, `tools-allowlist.json`,
`packed/hermes.aospkg`, and the three Hermes prompt files); QA `Q1` is exactly
those eight plus the three qf-proof controls and two qf-proof runtime files
(`tools/qf-proof-agent/dock-profiles.json`, `launch.json`,
`packed/qf-proof-agent.meta.json`, `packed/qf-proof-agent.aospkg`, and
`packed/qf-proof-agent.mjs`). Package identity is the literal
`package_ref` -> packed artifact -> sibling `.meta.json`/`launch.json` path
relation checked by `package-resource-paths.ts`; bytes and path sets must
remain exact for every retained row.

Native packaging pins, installer/signing/asar policy, Windows platform
qualification, and full package requalification remain G12 work. If a G7
dependency removal necessarily changes its own manifest/lock closure, G7 may
prove only that exact consequence with focused staging/resource identity;
G12 still owns the full package requalification.

All G8/G9/G10/G11/G12 ownership and the R18 freeze remain unchanged. The
inherited G6 reds remain inherited: `kernel-one-path` belongs to G8;
`package-inspect.test.ts` and `hermes-launch-policy` belong to G12. None is a
G7 PASS or repair target.
