# WO-N1 — Product identity: QuantFlow, not Collaborator

status: **parked — contract + draft order; do not cut until WO-K3 is done.**
Born 2026-07-27 from founder direction + a Claude diagnosis (accepted after measurement).
assignee: — (not cuttable)
depends: **WO-K3** (hard) — artifact bytes must already live under `~/.quantflow/` before this
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

**Ruled after K3:**

```
~/.quantflow/
  kernel.db                 # K1 — do not move
  artifacts/…               # K3 — do not move
  app/                      # N1 — was ~/.collaborator (and ~/.collaborator/dev/…)
    dev/worktree-<id>/…     # DEV isolation preserved
    …                       # prod app state
```

`paths.ts` `BASE` becomes `join(homedir(), ".quantflow", "app")`. Export rename:
`COLLAB_DIR` → **`QF_APP_DIR`** (every importer updated in the same commit). Env
`COLLAB_DEV_WORKTREE_ROOT` → **`QF_DEV_WORKTREE_ROOT`** (document the rename; accept old env as
one-release alias only if cheap — prefer hard cut with a boot log line naming the new var).

**Migration ritual (no migration runner exists):** on first boot after this lands, if
`~/.collaborator` exists and `~/.quantflow/app` does not, **copy** (not move) the tree into
`~/.quantflow/app`, log the action, then prefer the new root. Do not delete `~/.collaborator` in
this order — leave a dated note in the report; founder deletes after confirming. Workspace-local
`.collaborator/` directories (`ipc-workspace.ts`) become `.quantflow/` (same copy-on-first-seen
rule for the workspace folder name).

## RULING 3 — release target is this repo (architect, final)

Measured `collab-electron/package.json`:

| Field | Current | Required |
|---|---|---|
| `name` | `@collaborator/electron` | `@quantflow/electron` |
| `build.appId` | `com.collaborator.desktop` | `com.quantflow.ontology` |
| `build.productName` | `Collaborator` | `QuantFlow` |
| `build.publish` | `collabs-inc` / `collab-public` | `SidNig21` / `QuantFlow-Ontology` |

`install.sh` currently fetches `collaborator-ai/collab-public` releases — retarget to
`SidNig21/QuantFlow-Ontology`, or delete the script if this repo does not yet ship GitHub Releases
(report which; do not leave a script that installs upstream's binary under QuantFlow's name).

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
still says Collaborator → QuantFlow (or "QuantFlow Ontology" where a long name fits).

### D2 — app data root
`paths.ts` + every direct `~/.collaborator` join for **app-local** state → `~/.quantflow/app`.
`COLLAB_DIR` → `QF_APP_DIR`. Copy-on-first-boot migration per RULING 2. Artifact paths must
already be under the K3 root — if any `agent-artifacts` join remains under `.collaborator`, that is
a **K3 defect**, report and stop; do not re-home artifacts here.

### D3 — CLI / installer / skills chrome
`cli/collab-cli.mjs` user-visible strings and default paths; `install.sh`; canvas skill package
display names. Binary/command rename (`collab` → `quantflow` or `qf`) only if it does not fight
upstream package layout — if blocked by the seam, change strings and defaults, leave filename,
and report.

### D4 — gate `product-identity`
New static gate: fails if `collab-electron/package.json` still contains `com.collaborator`,
`productName": "Collaborator"`, `collabs-inc`, or `@collaborator/electron`; fails if `paths.ts`
BASE still joins `".collaborator"`. Allowlist bucket C paths (LICENSE, NOTICE, START_HERE lineage
sentence, `docs/orders/evidence/**`). **Does not** fail on the string `collab-electron/` or the
`upstream` remote URL.

### D5 — bait
Neuter `productName` back to Collaborator → gate red → restore → green.

---

## Out of scope

Renaming `collab-electron/` · changing `upstream` remote URL · rewriting LICENSE / NOTICE /
historical evidence · Kernel path (K1) · artifact root (K3) · Hermes profile paths under
`~/.hermes/` · Bovada / market rungs.

## Acceptance (when cut)

G1: cold suite green including `product-identity`.
G2: D5 bait transcript.
G3: fresh boot with a planted `~/.collaborator` stub copies into `~/.quantflow/app` and logs it;
    Kernel still opens at `~/.quantflow/kernel.db`.
G4: `rg` over `collab-electron/package.json` and `paths.ts` shows no Collaborator product strings.
G5: report lists every remaining `collaborator` match in the repo and which bucket (A/B/C) it is —
    bucket A count must be **zero**.

## Report-back

Plain-language open · D1–D5 evidence · migration log line · bucket A/B/C residual table ·
judgment where the order was silent (especially CLI binary rename).

---

## Why after K3 (do not pull forward)

K3 relocates artifact bytes into `~/.quantflow/`. This order relocates app-local state out of
`~/.collaborator/`. Running them together (or N1 first) creates two partial moves and no runner to
reconcile `storage_ref` rows — the exact orphan class debt #29 names. **Sequence: K1 → K2 → K3 → N1.**
