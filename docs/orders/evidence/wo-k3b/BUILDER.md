# WO-K3b — builder evidence · 2026-07-30

**In plain terms:** A2A collaboration reports now land on QuantFlow's durable artifact shelf, and a
gate rejects any production report writer that tries to create a separate shelf.

**Candidate branch:** `codex/wo-k3b`  
**Implementation commit:** `97a275a`

This is builder evidence, not a shipping verdict. A separate cold verifier decides PASS or REWORK.

## Read-only operator preflight

The default founder Kernel was opened read-only and only aggregate counts were read:

```text
all_artifacts=0
old_refs=0
```

No Kernel row, artifact byte, sidecar, or process was changed. There is no current founder data to
migrate; the implementation corrects future A2A writes.

## Implementation

The new pure `a2a-artifact-store.ts` owns the A2A storage adapter used by production and the gate.
Its default directory is `<getArtifactRoot()>/a2a`; an explicit `artifactDir` continues to bypass the
default for tests/embedding. It creates the directory, writes the supplied bytes, and publishes exact
`kind: report`, `path`, and `storage_ref` values through the caller's sole Kernel write function.

`a2a-bus.ts` now gives that store `getArtifactRoot` and `kernelExecute`. It no longer imports
`COLLAB_DIR` or owns a second mkdir/write implementation. Role registration, display/stdin delivery,
message contents, explicit overrides, and A2A core behavior are unchanged.

## Gate receipts

`bun qa/run.ts artifact-root` exited 0 and printed:

```text
artifact-root D5 production writer: PASS
artifact-root K3b A2A production writer: PASS
artifact-root G4 production coupling: PASS
artifact-root K3b A2A production coupling: PASS
artifact-root K3b governed publishers: PASS (a2a-bus.ts, agent-host.ts)
artifact-root OK
PASS  artifact-root
```

The dynamic A2A proof used the exact production helper with a temporary env-selected artifact root
and an in-memory Kernel. It began with an absent file, wrote bytes, published them, and proved exact
`storage_ref`, canonical-root containment, disk-byte equality, content hash, Kernel id, and returned
artifact id. A separate assertion proved the explicit override does not consult the default root.

The production scanner recursively excludes tests and requires exactly one direct
`publish_artifact` call in each governed adapter (`a2a-bus.ts`, `agent-host.ts`); missing, duplicate,
or third callsites fail.

## One acceptance pass

- `collab-electron/scripts/test-unit.sh`: **311 pass, 0 fail**.
- `collab-electron/bun run build`: **exit 0** for main, preload, and renderer.
- `bun qa/run.ts artifact-root`: **PASS**.
- `bun qa/run.ts kernel-sole-writer-app`: **PASS**.

The fresh worktree received one required `bun install --frozen-lockfile` before this pass. No broad
builder release verification or Linux package inspection was run.

## Required falsification

| Deliberate production break | Red receipt |
|---|---|
| Route the real A2A root back through `COLLAB_DIR` | `a2a-bus must give the production store getArtifactRoot`; exit 1 |
| Add a third production publisher file | expected exactly `a2a-bus.ts, agent-host.ts`; got the added `k3b-third-publisher-bait.ts`; exit 1 |

Both production edits were restored. One final focused run printed all receipts above and
`PASS artifact-root`; `git diff --check` was clean.

## Judgment

The storage helper is intentionally smaller than the A2A bus: it owns only directory selection,
byte writing, and the publish envelope. This lets the gate execute the exact production storage seam
without importing Electron/PTy delivery code. The official README already documents
`~/.quantflow/artifacts/`; this correction makes the second writer obey that existing concept, so no
new README architecture section was warranted. ROADMAP debt #29 should flip from narrowly reopened
to closed only in the independent PASS rotation.
