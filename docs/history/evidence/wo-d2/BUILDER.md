# WO-D2 — builder evidence · 2026-07-30

**In plain terms:** QuantFlow now has one Dock catalogue: clicking a profile launches that exact
profile through its packaged adapter, and a failed native-terminal launch no longer leaves a hidden
process or stolen collaboration role behind.

**Candidate branch:** `codex/wo-d2` (candidate commit recorded after this report commit). This is
builder evidence, not a shipping verdict; an independent cold verifier still decides PASS/REWORK.

## Runtime receipts

`bun qa/run.ts dock-definition-launch` exited 0 and printed:

```json
{
  "bootstrap": { "registered": 4, "secondBootSkipped": 4, "conflicts": 1 },
  "sharedHermes": {
    "packagePath": "app/species/hermes/packed/hermes.aospkg",
    "orchestratorArgv": ["-p", "qf-orchestrator", "--tui"],
    "workerArgv": ["-p", "qf-worker", "--tui"]
  },
  "links": {
    "orchestrator": "hermes-orchestrator",
    "worker": "hermes-worker"
  },
  "uniqueSoftware": [
    { "adapterId": "hermes", "packagePath": "app/species/hermes/packed/hermes.aospkg" },
    { "adapterId": "qf-toolloop", "packagePath": "app/tools/runtime-proof/packed/qf-toolloop.aospkg" }
  ],
  "peer": { "role": "orchestrator", "transportOpened": false },
  "cleanup": {
    "createFailure": "no residue",
    "startFailure": "closed receipt",
    "sameRoleRelaunch": "ok"
  },
  "legacyDockSurfaces": 0
}
```

The exact four package-owned defaults are `qf-toolloop`, `hermes-orchestrator`, `hermes-worker`,
and `hermes-worker-2`. A second bootstrap made zero writes. A pre-existing differing qf-toolloop
row was preserved, reported as one conflict, and only the other three definitions were registered.
The two launched Hermes sessions each carried exactly one `spawned_from` link to the definition
clicked. Null, unlisted, and unflagged profiles did not become peer roles; a duplicate role rejected
before process creation and could not reroute its existing owner.

The old `hermes-seats.ts`, `qf:seats:*`, preload seat methods, Peer Seats HTML/renderer branch, and
seat argv smoke are deleted. The production renderer sends only `{definitionId: row.id}`; the IPC
parser rejects every extra renderer field before definition resolution or process creation.

## App and gate evidence

- `collab-electron/scripts/test-unit.sh`: **311 pass, 0 fail** across the CI unit groups.
- `collab-electron/bun run build`: **exit 0**, including main, preload, and renderer builds. The
  first build attempt exposed a physically corrupt fresh esbuild binary; forced frozen reinstall
  changed it from a segfaulting invalid ELF to esbuild `0.28.1`, after which the same build passed.
- Required gates: `dock-definition-launch`, `dock-profile-identity`, `dock-registry`, `agent-path`,
  `repo-shape`, `lockfile-committed`, `kernel-sole-writer`, `kernel-sole-writer-app`,
  `no-canvas-domain-writes`, `doc-action-surface`, and `one-skin`: **all PASS**.
- The raw `bun test` command ran 38 integration/DOM/Electron files that the repository's CI script
  explicitly excludes and reported 48 environment failures (missing built sidecar/DOM/Electron).
  All D2 tests in that run passed. The authoritative `scripts/test-unit.sh` lane then passed cleanly;
  no unrelated tests were edited or deleted.

Two gate repairs were required by the D2 contract: the D1 callsite scanner now requires the new
`definitionId` symbol instead of the superseded `species` name, and `dock-registry` now uses the
same temporary cold dependency projection already proven by `agent-path` because Bun ignores
`NODE_PATH`. Law E separately allowlists the D2 gate's sanctioned Kernel open and execute fixture.

## Required falsification transcripts

| Guard | Deliberate production break | Red receipt | Restored receipt |
|---|---|---|---|
| profile argv | replaced `expandRuntimeAdapterArgv(...)` with base `argv` | `hermes-orchestrator production argv disagrees with adapter expansion`; exit 1 | `PASS dock-definition-launch` |
| exact Dock identity | changed `row.id` to `row.name` in the real Dock | `dock.js must derive definitionId from row.id`; exit 1 | `PASS dock-definition-launch` |
| sole catalogue | restored a real `dock-seats` Peer Seats element | `legacy Dock surface /dock-seats/ survives ... index.html`; exit 1 | `PASS dock-definition-launch` |
| failure compensation | removed the real `liveDelete` cleanup call | `create failure leaked child/live/PTY state`; exit 1 | `PASS dock-definition-launch` |

Every bait was restored with `git diff --check` clean. The builder did not run package closure or
the cold release verifier; packaged manifest/metadata inventory belongs to the independent verifier.

## Judgment and routed seam

Adapter configuration remains under the legacy founder file key `speciesEnv`, but production now
looks it up by packaged `adapterId`; changing the founder-owned file format was unnecessary. Only
Hermes receives built-in Hermes binary fallbacks. Every other host adapter must provide an explicit
absolute `HOST_ACP_BIN` and otherwise fails closed. Equivalent absolute/relative package paths use
one shared normalized adapter/package identity before AgentOS admission.

Native-TUI create/start failure, cancellation, teardown, PTY exit, and peer-role ownership are now
covered. The equivalent pre-existing host-ACP and AgentOS seams remain: both create a runtime before
the Kernel session, and a later Kernel create/start failure can still leave that runtime live. They
were not folded into D2 because doing so would change two untouched admission semantics. The
immediate, bounded follow-up is `docs/orders/WO-D2b.md`. D2 does not claim profile creation,
credentials, caller-bound grants, or unscripted real-model collaboration.
