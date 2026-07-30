# WO-N1 — Product identity: QuantFlow, not Collaborator

status: **open — current after WO-K3b PASS; adversarial pre-build read incorporated.**
Born 2026-07-27 from founder direction + a Claude diagnosis (accepted after measurement).
assignee: — (not cuttable)
depends: **WO-K3b** (hard) — every production artifact writer must live under `~/.quantflow/` before this
  order renames the remaining `~/.collaborator/` app-local root; doing both at once is two
  migrations with no runner.
closes: ROADMAP debt #30
blocks: nothing on the market ladder; may run parallel to WO-107b once K3 is done

## Objective

Make every **product-facing** surface say QuantFlow Ontology. Stop shipping, publishing, and
storing app state under Collaborator's name — without breaking the upstream merge seam.

## In plain terms

When you open the app, package it, or look in your home directory, it still claims to be a
different product. That is wrong. After this order the window, the installer, the GitHub release
target, and the app's own folders all say QuantFlow. The borrowed canvas code may keep living in a
folder named for where it came from — that is the fork boundary, not the product name.

**If it goes wrong:** either upstream pulls become permanent rename conflicts, or existing canvas /
config / seat state vanishes with no migration story, or `bun run release` still aims at a repo you
do not own.

---

## RULING 1 — three buckets; only one is in scope (architect, final)

Measured 2026-07-27: ~56 files mention `collaborator` / `.collaborator`; ~110 match lines in code
and docs. They are not one job.

| Bucket | Examples | This order |
|---|---|---|
| **A · Product identity** | `productName`, `appId`, `publish.owner/repo`, `~/.collaborator` app data, window/About strings, `install.sh` release fetch, npm package `@collaborator/electron` | **IN — change** |
| **B · Fork seam** | directory `collab-electron/`, git remote `upstream` → `collaborator-ai/collab-public`, package path imports that assume that folder | **OUT — keep forever** |
| **C · Lineage / law** | `START_HERE.md` "fork of collaborator-ai/collab-public", FSL license text, NOTICE, historical evidence under `docs/orders/evidence/` | **OUT — keep** (attribution and history are not branding) |
| **D · Input-only compatibility** | old paths/names read only by migration or cleanup | **IN — exact allowlist; never emitted as a default or product string** |

**Ruled: do not rename `collab-electron/`.** `upstream` is a live remote (`START_HERE` rule 7).
Renaming the directory turns every future upstream pull into a whole-tree rename conflict. The
folder name marks the borrowed layer; that is the dependency arrow made visible, not sloppiness.

**Ruled: do not rewrite history or LICENSE to erase Collaborator.** QuantFlow is a fork; the record
must stay honest.

## RULING 2 — data root moves under `~/.quantflow/`, beside the Kernel (architect, final)

WO-K1 already placed truth at `~/.quantflow/kernel.db`. WO-K3 places artifact bytes under that same
platform root. App-local state (canvas, config, PTY, sockets, terminals, host-mounts) still uses:

```
collab-electron/src/main/paths.ts:5
  const BASE = join(homedir(), ".collaborator");
```

plus several direct `join(homedir(), ".collaborator", …)` callsites (agent-artifacts until K3,
host-mounts, socket-path breadcrumb, ACP cache, canvas-plugin-offered).

**Ruled after K3b:**

```
~/.quantflow/
  kernel.db                 # K1 — do not move
  artifacts/…               # K3 — do not move
  app/                      # N1 — was ~/.collaborator (and ~/.collaborator/dev/…)
    dev/worktree-<id>/…     # DEV isolation preserved
    …                       # prod app state
```

`paths.ts` exposes two deliberate authorities:

```text
QF_APP_ROOT = ~/.quantflow/app
QF_APP_DIR  = production ? QF_APP_ROOT : QF_APP_ROOT/dev/worktree-<id>
```

Global breadcrumbs, host-mount configuration, integration markers, and legacy-input discovery use
`QF_APP_ROOT`. Canvas, config, PTY, logs, sockets, terminals, and other launch-local state use
`QF_APP_DIR`, preserving development worktree isolation. Export rename: `COLLAB_DIR` →
**`QF_APP_DIR`** (every importer updated in the same commit). Env
`COLLAB_DEV_WORKTREE_ROOT` → **`QF_DEV_WORKTREE_ROOT`** (document the rename; accept old env as
one-release alias only if cheap — prefer hard cut with a boot log line naming the new var).

**Migration ritual (no migration runner exists):** before logger/config/sidecar consumers create the
new destination, copy persistent legacy state into a sibling staging directory and atomically rename
that staging directory to `QF_APP_ROOT` only after complete success. Never follow symlinks; never
copy `kernel.db*`, `agent-artifacts/`, sockets, PID files, or generated endpoint breadcrumbs. If both
roots exist, leave the new root byte-unchanged, prefer it, and log the conflict. A failed copy leaves
the final destination absent so the next boot retries. Never move or delete the source.

Electron's Linux `userData` currently lives beneath `~/.config/@collaborator/electron/...` and holds
browser partitions, cookies, local/session storage, and preferences. Include it in the staged
migration and set the new production/development `userData` to `QF_APP_DIR/electron` before browser
consumers open. Workspace-local `.collaborator/` directories become `.quantflow/` through one shared
copy-on-first-seen helper invoked before configured-workspace boot, workspace add, thumbnail-cache
selection, and replay-cache use. Preserve the legacy ignore entry and add `.quantflow/`.

Before the founder ever removes `~/.collaborator`, report the read-only count of Kernel
`storage_ref` values beneath that root. Deletion advice is forbidden unless the count is zero; this
order itself never deletes the old root.

## RULING 3 — release target is this repo (architect, final)

Measured `collab-electron/package.json`:

| Field | Current | Required |
|---|---|---|
| `name` | `@collaborator/electron` | `@quantflow/electron` |
| `build.appId` | `com.collaborator.desktop` | `com.quantflow.ontology` |
| `build.productName` | `Collaborator` | `QuantFlow` |
| `build.publish` | `collabs-inc` / `collab-public` | `SidNig21` / `QuantFlow-Ontology` |

`install.sh` currently fetches `collaborator-ai/collab-public` releases — retarget to
`SidNig21/QuantFlow-Ontology`; the AppImage/release path exists, so do not delete it. Do not run the
release command in acceptance because it reads credentials; inspect its production configuration and
the unsigned package instead.

**Identity matrix (pinned):** OS/product name `QuantFlow`; long human-facing name
`QuantFlow Ontology`; app id `com.quantflow.ontology`; private package `@quantflow/electron`; Linux
executable/install name `quantflow`; canvas control command `qf-canvas`; release repository
`SidNig21/QuantFlow-Ontology`. Keep internal upstream seams such as `collab-electron/`, `@collab/*`,
`collab-file`, and tmux compatibility names where they are not product-facing.

---

## Context — measured facts (verify before cut)

| Fact | Measured 2026-07-27 |
|---|---|
| `upstream` remote | `https://github.com/collaborator-ai/collab-public.git` — keep |
| Files mentioning collaborator (excl. node_modules) | ~56 |
| `paths.ts` BASE | `~/.collaborator` |
| Direct `~/.collaborator` joins outside COLLAB_DIR | host-mounts, json-rpc socket-path, integrations, acp-agent, agent-host artifacts (K3 owns artifacts), cli-installer, sidecar fallback |
| `bun run release` | publishes to **a GitHub repo the founder does not own** — fails on auth today; still wrong |
| Kernel path | already `~/.quantflow/kernel.db` — out of scope to move |

---

## Deliverables (when cut)

### D1 — packaging identity
`collab-electron/package.json` fields per RULING 3. Any About / window title / tray string that
still says Collaborator → QuantFlow (or "QuantFlow Ontology" where a long name fits). Update
`bun.lock`, `upload-to-github.cjs`, packaged update metadata, the upstream issue link shown in the
shell, `install.sh` Linux/macOS names, and every production release target named by the pinned matrix.
Do not run release or read a credential.

### D2 — app data root
Implement `QF_APP_ROOT` / `QF_APP_DIR` and the staged global, Electron `userData`, and workspace
migrations exactly as RULING 2 specifies. One migration helper must run before every existing and new
workspace consumer, not only `workspace:add`. Artifact paths must already be under the K3b root; if
any production artifact writer still derives from app state, report and stop rather than re-home it.

### D3 — CLI / installer / skills chrome
`cli/collab-cli.mjs` user-visible strings/default paths; `install.sh`; canvas skill display names.
Install `quantflow` and retain `qf-canvas` for canvas control. Remove the app-owned old installed
wrapper during installation, but keep source filenames/folders whose rename would only increase
upstream conflicts.

### D4 — gate `product-identity`
New gate with two coupled surfaces:

1. Source identity fails on stale package/app/product/publish fields, emitted `.collaborator`
   defaults, and user-facing Collaborator chrome. Bucket C plus exact bucket-D migration readers are
   allowlisted; `collab-electron/`, `upstream`, `@collab/*`, and historical evidence remain legal.
2. Extend package inspection to assert the unsigned Linux executable name, packaged `app.asar`
   manifest identity, `app-update.yml` owner/repo, and absence of a production
   `collabs-inc/collab-public` update target.
3. Run the migration matrix through the exact production helper: old-only copies persistent canaries
   byte-for-byte; both-exist preserves new bytes; injected failure leaves no final root and retry
   succeeds; Kernel/artifact/PID/socket canaries are excluded; source hashes never change. Prove an
   existing configured workspace migrates before boot consumers, not only on add.

### D5 — required falsification

Three independent production baits, each red → restore → green:

1. Revert `productName` to Collaborator.
2. Remove/no-op the production migration call so the helper's unit proof remains green but real boot
   no longer delegates.
3. Revert the packaged update owner/repository to the old target.

### D6 — current documentation

Update the official root README and current runtime/demo docs with the final layout:

```text
~/.quantflow/kernel.db
~/.quantflow/artifacts/
~/.quantflow/app/
```

Do not rewrite historical work orders/evidence or attribution.

---

## Out of scope

Renaming `collab-electron/` · changing `upstream` remote URL · rewriting LICENSE / NOTICE /
historical evidence · Kernel path (K1) · artifact root (K3) · Hermes profile paths under
`~/.hermes/` · Bovada / market rungs.

## Acceptance (when cut)

Builder, once after the complete implementation batch:

```bash
cd collab-electron && ./scripts/test-unit.sh && bun run build
cd ..
bun qa/run.ts product-identity
bun qa/run.ts artifact-root
bun qa/run.ts kernel-sole-writer-app
```

A separate verifier runs `bun qa/verify-release.ts` once from a fresh detached worktree, including
the real unsigned Linux package, then independently repeats the three production baits.

G1: builder runs unit/build and focused `product-identity` + migration gates once after the whole
    batch; independent verifier runs canonical cold release once.
G2: all three D5 bait transcripts.
G3: full staged migration matrix, existing-workspace boot proof, Electron `userData` proof, and
    Kernel still opening at `~/.quantflow/kernel.db`.
G4: shipped Linux identity/update receipts plus source scan.
G5: report lists every remaining `collaborator` match by bucket A/B/C/D; bucket A count is zero and
    every bucket-D match is input-only compatibility.
G6: read-only old-root artifact-reference count; never advise deletion unless zero.

## Report-back

Plain-language open · D1–D6 evidence · migration/failure/retry receipts · shipped identity · bucket
A/B/C/D residual table · old-root artifact-reference count · judgment where the order was silent.

## REWORK ROUND 1 — 2026-07-30 · ONE INTEGRATION ITEM

Independent cold verification of exact candidate `c7f955a` passed frozen install, all unit tests,
the production build, and real Linux package inspection. The all-QA stage then correctly failed:
`kernel-one-path` found the intentional legacy `kernel.db` exclusion canary inside the new
`product-identity` fixture outside its exact fixture allowlist.

Repair `a710786` adds only `qa/gates/product-identity.ts` to the existing scanner's allowlist. A
sibling QA bait containing the same literal still fails the scanner, proving the exception did not
widen to `qa/gates/` or production code; removing the bait restores green. No packaged source,
migration behavior, dependency, schema, Kernel path, or release configuration changed. The repaired
candidate returns to independent verification; the failed cold run is not a shipping verdict.

---

## Why after K3b (do not pull forward)

K3/K3b relocate every production artifact writer into `~/.quantflow/`. This order relocates app-local state out of
`~/.collaborator/`. Running them together (or N1 first) creates two partial moves and no runner to
reconcile `storage_ref` rows — the exact orphan class debt #29 names.
**Sequence: K1 → K2 → K3 → K3b → N1.**
