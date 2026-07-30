# WO-D2 — verification PASS · 2026-07-30

**In plain terms:** QuantFlow's shipped Linux app now builds its Dock from packaged agent
profiles, launches the exact selected profile, preserves collaboration delivery, and cleans up
honestly when a native terminal agent cannot be recorded or started.

**Verdict:** **PASS** at `457446a0f5d033c27fb4a08db49308a04e64bd74`.
Verification used a fresh detached worktree with no inherited dependencies or build output and did
not use the builder report as evidence.

## Canonical cold release receipt

Before the canonical run, the detached candidate had no
`collab-electron/node_modules`, Electron `dist`, or Kernel/schema `node_modules`.
The verifier ran the one canonical command once:

```text
$ bun qa/verify-release.ts
release: runId=02131d58-ab88-4b69-8642-0be80ec5cbfc
...
PASS  package-closure
PASS  runtime-proof
PASS  kernel
PASS  typecheck
...
dock-profile-identity OK
PASS  dock-profile-identity
dock-definition-launch OK
PASS  dock-definition-launch
...
PASS  vault-projection

PASS  release-verification
```

That run completed the frozen Electron install, bare-environment unit suite, production build,
unsigned Linux package, package inspection, and the complete QA board. The package receipt recorded
the same run id and package root
`collab-electron/dist/linux-unpacked`.

## Definition, launch, peer, and cleanup receipts

The independently repeated production gate printed:

```json
{
  "bootstrap": {
    "registered": 4,
    "secondBootSkipped": 4,
    "conflicts": 1
  },
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
    {
      "adapterId": "hermes",
      "packagePath": "app/species/hermes/packed/hermes.aospkg"
    },
    {
      "adapterId": "qf-toolloop",
      "packagePath": "app/tools/runtime-proof/packed/qf-toolloop.aospkg"
    }
  ],
  "peer": {
    "role": "orchestrator",
    "transportOpened": false
  },
  "cleanup": {
    "createFailure": "no residue",
    "startFailure": "closed receipt",
    "sameRoleRelaunch": "ok"
  },
  "legacyDockSurfaces": 0
}
```

The gate reached production profile discovery, runtime resolution, argument expansion, peer-role
registry, and native-TUI orchestration rather than QA copies. Its green run established:

- first boot registered exactly the three Hermes profiles and qf-toolloop; second boot wrote no
  rows or events;
- an operator-owned conflicting qf-toolloop definition remained unchanged while the other three
  defaults registered;
- four profiles deduplicated to two adapter/package software identities;
- Hermes orchestrator and worker expanded to the exact profile arguments above;
- each admitted session had exactly one `spawned_from` link to the selected definition;
- only opted-in, listed, non-null Hermes selectors received peer delivery; qf-toolloop and null or
  unlisted selectors did not;
- duplicate peer-role ownership failed before child creation, could not reroute the existing
  owner, and non-owner unregister could not remove it;
- injected Kernel create failure left no child, live entry, PTY map, peer role, session, link, or
  event, then the same role relaunched;
- injected Kernel start failure removed the same runtime state, durably failed then closed the
  created session, preserved its `spawned_from` receipt, then the same role relaunched.

## Independent falsification transcripts

The verifier changed only a disposable detached worktree, restored after every bait, and ended
with `git diff --exit-code` equal to zero.

| Guard | Deliberate production break | Red receipt | Restored receipt |
|---|---|---|---|
| exact runtime-profile argv | returned base `argv` for a non-null profile in `runtime-adapter.ts` | `orchestrator argv wrong: ["--tui"]`; `FAIL dock-definition-launch` | exact `["-p","qf-orchestrator","--tui"]`; PASS |
| Dock identity | changed the real Dock launch id from `row.id` to `row.name` | `collab-electron/src/windows/shell/src/dock.js must derive definitionId from row.id`; FAIL | PASS |
| one catalogue | restored a real `<section id="hermes-seats">Peer Seats</section>` in the shipped Dock | `legacy Dock surface /hermes-seats/ survives in collab-electron/src/windows/shell/index.html`; FAIL | `legacyDockSurfaces: 0`; PASS |
| native-TUI compensation | removed the production `terminatePty()` call after an injected Kernel failure | `create failure leaked child/live/PTY state`; FAIL | `createFailure: "no residue"`, `startFailure: "closed receipt"`, same-role relaunch OK; PASS |

## Shipped runtime-control inventory and bytes

The verifier inspected the real package produced by the canonical run and compared each requested
resource with its source file:

| Packaged resource | Bytes | SHA-256 | Source match |
|---|---:|---|---|
| `species/hermes/dock-profiles.json` | 555 | `f62120a2d3c19286164adf090225a2ed14b13ae89489681fe2f8bc1dcebeab42` | byte-for-byte |
| `tools/runtime-proof/dock-profiles.json` | 269 | `1e10736e2fd6b504acc2677d56e06e0a8856c6697e801662641aed1f8fa517ec` | byte-for-byte |
| `species/hermes/packed/hermes.meta.json` | 565 | `07d91e25c764d23b9dc55ffa874ea3b73cfdc5b423ebe475b880b7520e5c68b8` | byte-for-byte |
| `tools/runtime-proof/packed/qf-toolloop.meta.json` | 85 | `8f3ba524895014496656a93a0cf216f6db7c3b7f012de6ff00f2467d96551c97` | byte-for-byte |

The copied-package missing-bootstrap control independently removed exactly one inventory path and
no others:

```json
{"target":"species/hermes/dock-profiles.json","removed":["species/hermes/dock-profiles.json"],"added":[]}
{"ok":false,"reason":"runtime control file missing: species/hermes/dock-profiles.json"}
```

The original package remained unchanged.

## Measured remaining seam and routed order

Host ACP still calls `admitHostAcp()` and writes its live entry before the Kernel create/start
sequence without a surrounding compensating catch. AgentOS likewise calls
`host.createSession(adapterId)` and writes live state before those Kernel commands without
guaranteed `destroySession()` on an exception. Those are real orphan seams, but WO-D2 did not
touch their launch semantics and therefore did not claim them fixed. The candidate routes the
small, immediate follow-up as `docs/orders/WO-D2b.md`, with separate host-ACP and AgentOS teardown
baits. Native-TUI compensation, which WO-D2 did touch, is independently green above.

## Judgment and limits

The packaged manifest is discovery authority, while each Kernel `agent_definition` remains the
durable identity and the package metadata remains the launch contract. That separation is
consistent with the one-truth rule: boot is idempotent, conflicts preserve operator rows, and the
renderer can submit only a definition id rather than runtime overrides.

WO-D2 proves package presence, exact profile launch, peer-delivery authorization, ownership-safe
cleanup, and Kernel evidence. It does not prove grants/caller identity, profile-home behavior, real
model calls, credentials, or the still-routed ACP compensation seam. No credential, bet, or trade
path was exercised.
