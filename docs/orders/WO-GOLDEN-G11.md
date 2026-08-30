# WO-GOLDEN-G11 — Authority and history compression

This order removes only proven stale instruction and history noise so a fresh
agent sees one truthful route while every required receipt remains recoverable.

status: AMENDED AFTER READER NO / NO — SAME READER REREAD REQUIRED; no G11 Builder authority
kind: Golden Baseline Phase 2 bounded authority/history group
owner: Router
depends: WO-GOLDEN-G10 CLOSED / independent Verifier PASS
build-authority: **CLOSED until replacement Reader task `01a050eb-06dd-7450-978e-d684f0063538` rereads the exact amendment commit and returns YES / YES; this packet does not implement G11**
router-authority: **ORDER-ONLY — may amend this order and its exact manifests, commit only those authority paths, and route the replacement Reader; may not implement product, tests, gates, Canvas, Kernel, R18, packaging, or operations**
verifier-authority: **One independent G11 Verifier must inspect the eventual candidate and all falsifier transcripts; the Builder and Router cannot accept their own work**
golden-fast-mode: **BOUND BY `docs/orders/GOLDEN-RUN.md` §Golden Fast Mode; this group is documentation/history-only and does not authorize a product rebuild or package lifecycle run**

## Frozen starting identity

The immutable product baseline for G11 is the independently accepted G10
candidate:

| Item | Frozen value |
|---|---|
| Accepted product candidate | `96ad59984a62dc8defe224c4404b34c7ca3b2157` |
| Accepted product tree | `10ae35acc709b96da6c535dd88ff13f11297906d` |
| G10 parent | `d25a2bba382407f34b359e0bdfed82aea39e39a5` |
| Accepted G10 gate-source SHA256 | `3C16550ECA9EE466F8FA058B121DFBA3C6D045956EAC4A8090311D54D2DAF2D4` |
| Reused product bundle SHA256 | `3006C94B2B7638B295F09CACF2BE5CD4F70831230BCE203DAABCE71B14BCD681` |
| G10 independent Verifier task | `01a0508a-43f5-7101-9416-0683ba081449` |
| G11 authority starting commit | `b1720c086bb2d93942448a3fdd352b7d58af9483` |
| G11 authority starting tree | `97b2768e3bc79d45c321336e73ec30167c6c8959` |
| Exact current authority denominator | `1,421` tracked paths, including this order |
| Starting checkout condition | clean worktree at the authority starting commit |

The starting authority commit contains the minimal G10 closure, this prepared
G11 order, the durable
independent acceptance, and the evidence-only stale-hash clarification. The
original G10 builder receipt remains immutable. G11 must not reinterpret the
four older pre-existing `qf-g10-*` roots excluded by G10's exact-run
attribution, and it must not reopen the accepted G10 candidate.

## Founder-approved scope and Reader gate

This packet implements the founder-approved Surgical Disposition Group G11:

> **G11 — Authority and history compression.** Repair AGENTS, README,
> AUTONOMY, PROTOCOL, GOLDEN-RUN, capability/current-stack claims; keep
> NEXT.md, one selected order, current route/status, laws, and the compact
> accepted-floor index; move obsolete orders/evidence/plans/research route
> frames/screenshots out of ordinary active-tree context after hash
> preservation; repair Atlas exact-SHA receipt wording without expanding
> analyzer capability; remove `.mcp.json` unless an exact current developer
> workflow is named; decide Vault projection, Canvas skill, and GLACIER
> reference retention explicitly. Proof is boot/route/doc-link gates plus a
> fresh-agent cold read showing exactly one current authority path and no false
> product/runtime claims.

Before any Builder action, one fresh semantic Reader must read
`START_HERE.md`, `docs/orders/PROTOCOL.md`, `docs/orders/GOLDEN-RUN.md`,
`docs/orders/NEXT.md`, this order, and the Phase-1 disposition packet. The
Reader must answer both questions. The required replacement Reader is task
`01a050eb-06dd-7450-978e-d684f0063538`; no substitute Reader may open Builder
authority:

1. Does `NEXT.md` point to exactly this bounded G11 order, with G10 closed and
   G12's inherited package/process red still outside G11?
2. Does the allowlist preserve canonical authority, immutable evidence, and
   product/Kernel/Canvas/R18/G12 boundaries while limiting mutation to proven
   stale or duplicated authority/history surfaces?

The required verdict is exactly **YES / YES**. Any **NO**, ambiguity, or new
semantic choice stops the route; Router records the question and does not open
Builder authority. This is the requested stopping point for the current turn.

## Phase-1 basis and complete denominator

The Phase-1 audit is the authority for why these surfaces are candidates. Its
immutable receipt records 1,150/1,150 tracked files, 153/153 direct
dependencies, 19/19 Electron declarations/hooks, 40 unique bounded
operational roots, 24 local file edges, four disjoint lanes, and zero
unresolved classifications. It identifies 312 old order/evidence/history
files as archive candidates, while explicitly preserving recoverability and
the current product, Kernel, R18 adapter, verification, and support surfaces.

The G11 starting-tree denominator is exactly the 1,421 tracked paths at
`b1720c086bb2d93942448a3fdd352b7d58af9483` / tree
`97b2768e3bc79d45c321336e73ec30167c6c8959`, including this order. The exact
path, starting Git blob, class, proof state, disposition, and destination for
every path are frozen in
`evidence/golden-baseline/g11/G11-CURRENT-DISPOSITION.tsv`. There is no implicit
complement and no directory glob that grants mutation authority.

**Administrative-path convention.** The four amendment manifests created
after the 1,421-path start are administrative additions, not denominator
members:

```text
docs/orders/evidence/golden-baseline/g11/G11-CURRENT-DISPOSITION.tsv
docs/orders/evidence/golden-baseline/g11/G11-IMMUTABLE-PRESERVATION.tsv
docs/orders/evidence/golden-baseline/g11/G11-ARCHIVE-MAP.tsv
docs/orders/evidence/golden-baseline/g11/G11-PHASE1-EXTERNAL.tsv
```

They may record the frozen tree and later receipts but cannot classify
themselves, authorize another mutation, or hide a denominator change. The
Builder begins at the exact amendment commit accepted by the replacement Reader; that
commit is an administrative overlay on this frozen denominator. The Builder
must independently reproduce the exact 1,421 baseline rows and blob identities
before changing anything, using:

```text
git rev-parse b1720c086bb2d93942448a3fdd352b7d58af9483
git rev-parse b1720c086bb2d93942448a3fdd352b7d58af9483^{tree}
git ls-tree -r --name-only b1720c086bb2d93942448a3fdd352b7d58af9483
git ls-tree -r b1720c086bb2d93942448a3fdd352b7d58af9483
bun qa/run.ts golden-g11-authority
```

The manifest is evidence, not a second truth store: this order owns disposition
meaning and Git owns the bytes. Any absent row, duplicate row, blob mismatch,
or proof cell marked `UNPROVED` forces `RETAIN_FAIL_CLOSED`. Every starting path
belongs to exactly one of these denominator partitions:

### A — current authority and claim surfaces (allowlisted)

These are the only current-authority files G11 may repair for stale or false
claims, and each edit must name the Phase-1 finding it closes:

```text
AGENTS.md
README.md
docs/orders/NEXT.md
docs/orders/AUTONOMY.md
docs/orders/PROTOCOL.md
docs/orders/GOLDEN-RUN.md
docs/proposals/CAPABILITY-REGISTRY.md
docs/PRODUCT.md
docs/RESEARCH.md
qf-atlas/ATLAS.md
```

`NEXT.md` may change only to close G10, point to this prepared G11 order, and
record the resulting route. `qf-atlas/ATLAS.md` may change only for exact-SHA
receipt wording; no analyzer, coverage, ownership, or risk capability may be
added. `.mcp.json` is retained unchanged: it names the current explicitly
invoked `colorsandfonts` MCP developer workflow.

### B — authority-adjacent developer instruments (decision-only)

These literal path sets have one outcome in this order:

```text
tools/qf-vault-projection/**
collab-electron/packages/collab-canvas-skill/**
design/glacier/**
.mcp.json
```

| Literal path set | Exact G11 outcome | Reason |
|---|---|---|
| `tools/qf-vault-projection/**` | `RETAIN_FAIL_CLOSED` | no complete non-QA/future-route proof exists |
| `collab-electron/packages/collab-canvas-skill/**` | `RETAIN_FAIL_CLOSED` | no complete package/runtime consumer proof exists |
| `design/glacier/**` | `RETAIN_FAIL_CLOSED` | ADR-0004 calls for archive, but direct per-path package/runtime/QA/future-route proof is incomplete |
| `.mcp.json` | `RETAIN_CURRENT_WORKFLOW` | current explicitly invoked `colorsandfonts` MCP developer workflow; unchanged |

They remain instruments, not Kernel truth, product runtime authority, or
acceptance authority. This finite G11 does not isolate, retire, move, or edit
any of them. A later order may reconsider them only with all five direct proof
columns green.

### C — history and agent-context candidates (exact-manifest only)

The exact current classification is the 1,421-row disposition manifest. All
history and agent-context paths are `RETAIN_FAIL_CLOSED` unless that manifest
assigns a unique archive destination. The sole archive target is
`docs/plans/2026-08-16-001-feat-atlas-finish-line-plan.md`, whose exact mapping
and original hashes are in `G11-ARCHIVE-MAP.tsv`. No wildcard, directory-wide
delete, parent cleanup, inferred status, or unlisted move is allowed.

The following are protected from archive compression unless a later Reader
explicitly changes this order:

```text
docs/orders/NEXT.md
docs/orders/PROTOCOL.md
docs/orders/GOLDEN-RUN.md
docs/orders/WO-GOLDEN-G10.md
docs/orders/evidence/golden-baseline/g10/**
docs/orders/WO-GOLDEN-G11.md
docs/orders/evidence/golden-baseline/g11/**
docs/orders/WO-R18-GROUND.md
docs/orders/evidence/r18/**
docs/DOCTRINE.md
docs/LAWS.md
docs/DEBT.md
docs/adr/**
```

The archive map is one-to-one. Its destination must not exist at start; a
duplicate destination, case-folded collision, ambiguous old/new reference, or
unresolved exact tracked reference is RED before mutation. The Builder moves
the file byte-exactly and rewrites every tracked exact reference outside the
archived payload to its one destination. The payload's own line naming its
former source path is deliberately excluded from rewrite and ambiguous-
reference checks because changing it would violate byte preservation; it is
historical content, not a live pointer. Run `doc-links` and prove the
destination SHA256 equals the recorded source SHA256. Exactly 380 tracked
Phase-1 authority, G1–G10, Pre-R18, R18, and accepted-floor files are
enumerated with original SHA256 and location in
`G11-IMMUTABLE-PRESERVATION.tsv`; every row is `RETAIN_IMMUTABLE`. The external
Phase-1 packet is a separate content-addressed check defined by
`G11-PHASE1-EXTERNAL.tsv`; it is not counted as a tracked file.

The sole archive row earns all required proof independently. The Builder runs
these exact read-only probes at the frozen start and stores output hashes:

| Proof | Exact probe | Required result |
|---|---|---|
| P01 non-current | `Select-String -Path docs/plans/2026-08-16-001-feat-atlas-finish-line-plan.md -Pattern 'Product authority:.*NEXT.md','artifact_readiness: requirements-only'` | both declarations present; this plan disclaims authority |
| P02 non-packaged | `git grep -n -F '2026-08-16-001-feat-atlas-finish-line-plan' -- ':(glob)**/package.json' ':(glob)**/electron-builder*.yml' ':(glob)**/electron-builder*.yaml' ':(glob)**/forge.config.*'` | exit `1`, empty |
| P03 non-runtime | `git grep -n -F '2026-08-16-001-feat-atlas-finish-line-plan' -- collab-electron packages qf-kernel-schema tools qf-atlas` | exit `1`, empty |
| P04 non-state/authority | `git grep -n -F '2026-08-16-001-feat-atlas-finish-line-plan' -- START_HERE.md docs/orders/NEXT.md docs/DOCTRINE.md docs/LAWS.md docs/orders/PROTOCOL.md docs/DEBT.md docs/adr` | exit `1`, empty |
| P05 non-QA | `git grep -n -F '2026-08-16-001-feat-atlas-finish-line-plan' -- qa .github` | exit `1`, empty |
| P06 non-future-route | `git grep -n -F '2026-08-16-001-feat-atlas-finish-line-plan' -- docs/orders/GOLDEN-RUN.md docs/plans/INSTITUTIONAL-BUILD-PLAN.md docs/orders/WO-R18-GROUND.md docs/orders/evidence/r18` | exit `1`, empty |

Any different result changes the archive row to `RETAIN_FAIL_CLOSED`; it does
not authorize a second target.

### D — protected complement and explicit hard boundaries

Every starting path not in A, B, or the exact C manifest is protected and must
remain byte-for-byte unchanged. In particular, G11 may not touch product
packages, Kernel/schema code, Electron runtime behavior, existing
`qa/gates/**` assertions, package scripts or dependencies, lockfiles,
`.github/workflows/**`, R18 acquisition/product paths, or any package/install,
PTY, process-root, shutdown, or relaunch surface owned by G12.

The path diff, not intent, is the gate: any changed path outside A, B, the
recorded exact C manifest, the specifically authorized new static verifier and
its one `qa/run.ts` registration line, or the G11 administration paths
(`docs/orders/WO-GOLDEN-G11.md` and
`docs/orders/evidence/golden-baseline/g11/**`) is an immediate scope RED.

## Purpose and health ownership

| Surface | Phase-1 health finding | G11 owner and permitted result |
|---|---|---|
| `NEXT.md` and selected-order route | Delivery authority is coherent only at the route; surrounding claims conflict | Router owns the pointer; exactly one selected G11 order after Reader YES/YES |
| `AGENTS.md`, `README.md`, capability/current-stack claims | Stale Claude, peer-bus, qf-toolloop, and old runtime claims create false current authority | Builder repairs claims to the live product or labels them historical; Reader checks the cold path |
| `AUTONOMY.md`, `PROTOCOL.md`, `GOLDEN-RUN.md` | Process language contains stale phase/currentness and authority overlap | Builder repairs only routing/role/phase truth; canonical rules remain binding |
| Phase-1/accepted-floor/laws/DOCTRINE records | Required immutable authority/evidence | Protected; no compression may erase or rewrite them |
| Atlas | Receipt-honesty blocker, not a product blocker; header carries stale branch/SHA wording | Exact receipt wording only; analyzer scope stays unchanged |
| Vault projection | Read-only developer instrument with no named current operator duty | `RETAIN_FAIL_CLOSED`; no mutation |
| Canvas skill/CLI | Instrument with underdocumented boot-time external mutation | `RETAIN_FAIL_CLOSED`; no mutation and no product-truth claim |
| GLACIER reference | Reference/design surface, not live product authority | `RETAIN_FAIL_CLOSED`; no mutation because direct proof is incomplete |
| G12 package/process surfaces | Inherited red is explicitly separate | G12 owns the red; G11 records it and does not repair, relabel, or rerun package proof |

The health target is one current authority path, no stale present-tense
product/runtime claim in the normal cold read, explicit historical labeling,
and recoverable evidence. G11 does not claim a product or package release.

## Bounded execution and Golden Fast Mode

### Exact runnable starting matrix

The Builder records command, exit code, duration, unedited output, and SHA256
of each output. Rows 1–7 and 10 are the pre-mutation matrix. Rows 8–9 become
runnable only after the authorized static verifier exists. After implementation
the Builder reruns the complete restored rows 1–10, and all must be green. This is the complete
G11 matrix; no package, Electron lifecycle, installer, PTY, process-root, or
release command is permitted.

| Row | Exact command | Required result |
|---|---|---|
| 1 | `git rev-parse b1720c086bb2d93942448a3fdd352b7d58af9483` | exact denominator start `b1720c086bb2d93942448a3fdd352b7d58af9483` |
| 2 | `git rev-parse b1720c086bb2d93942448a3fdd352b7d58af9483^{tree}` | exact denominator tree `97b2768e3bc79d45c321336e73ec30167c6c8959` |
| 3 | `git status --short` | empty at the replacement-Reader-approved amendment commit |
| 4 | `git ls-tree -r --name-only b1720c086bb2d93942448a3fdd352b7d58af9483 | Measure-Object` | `Count = 1421` |
| 5 | `bun qa/run.ts repo-shape` | exit `0`, PASS |
| 6 | `bun qa/run.ts doc-links` | exit `0`, PASS |
| 7 | `bun qa/run.ts rung-ladder` | exit `0`, PASS |
| 8 | `bun qa/run.ts golden-g11-authority` | exit `0`, PASS |
| 9 | `$env:QF_G11_COLD_READ='1'; bun qa/run.ts golden-g11-authority; Remove-Item Env:QF_G11_COLD_READ` | exit `0`; prints the exact route `AGENTS.md → START_HERE.md → NEXT.md → WO-GOLDEN-G11.md`, `current_authority_paths=1`, `false_current_claims=0`, and inherited G12 RED |
| 10 | `git diff --exit-code b1720c086bb2d93942448a3fdd352b7d58af9483 -- packages qf-kernel-schema collab-electron .github` | exit `0`, empty |

G11 authorizes exactly one new pure static verifier and its mechanical
registration: `qa/gates/golden-g11-authority.ts` plus the minimum registration
line in `qa/run.ts`. It reads Git-tracked documents/manifests only, performs no
network, package, build, Electron, process, user-data, or product operation,
and implements the F01–F10 selectors and cold-read mode below. No existing
gate or assertion may be changed. Those two paths are the sole exception to
the otherwise unchanged test/gate boundary and must appear as
`G11_STATIC_VERIFIER_ONLY` in the final diff receipt. The independent Verifier
must also begin in a fresh session with no prior G11 transcript, follow that
printed four-file route, and record the same three exact values; disagreement
with the static output is RED.

The Builder may start only after the Reader gate and only from the exact
Reader-approved amendment commit layered on the frozen denominator. The
execution is:

1. Freeze the exact starting matrix and path/hash manifest once. Do not refresh
   the denominator after mutation to hide a changed path.
2. Run parallel read-only preflight checks for status, diff hygiene, route,
   links, and the current claim inventory. A red preflight stops the run.
3. Make one bounded documentation/history pass under the allowlist. Preserve
   all immutable evidence and record every move by exact path and hash.
4. Run the exact matrix above plus the fresh-agent cold read. No
   Electron rebuild, package install, installer, shutdown/relaunch, PTY
   prebuild, process-root cleanup, or full release verifier is part of G11.
5. Produce the Builder receipt with starting/final SHA and tree, exact changed
   path manifest, all command lines, exit codes, durations, output hashes,
   falsifier transcripts, and archive hash map.
6. Stop for one independent Verifier. The Verifier reruns the critical
   boundaries and decides PASS/RED; Router does not mark G11 accepted.

The accepted G10 product bundle hash is an identity boundary only. G11 does
not rebuild it, change it, or use it to imply a package/operations pass. The
inherited G12 red remains visible in every G11 receipt:

```text
G12 package/process status: RED — inherited; not exercised or repaired by G11
G10 owned-run final: processes=0 roots_remaining=0 leaked=[]
```

## Fail-capable falsifiers

Each falsifier must be run as a real bait → RED → restore → GREEN transcript.
The bait must change only the isolated copy or exact allowlisted candidate
being tested; it must never weaken an assertion or alter product state.

| ID | Exact RED command and isolated static bait | Required RED | Exact restored GREEN command |
|---|---|---|---|
| G11-F01 | `$env:QF_G11_FALSIFY='F01'; bun qa/run.ts golden-g11-authority` injects a second active pointer into the verifier's in-memory document copy | nonzero; `F01 multiple_current_routes` | `Remove-Item Env:QF_G11_FALSIFY; bun qa/run.ts golden-g11-authority` |
| G11-F02 | selector `F02` injects one forbidden present-tense Claude/peer-bus/qf-toolloop runtime claim into the in-memory claim inventory | nonzero; `F02 false_current_claim` | same normal command |
| G11-F03 | selector `F03` exposes the archive-map source and destination simultaneously in the in-memory active-search set | nonzero; `F03 historical_active_noise` | same normal command |
| G11-F04 | selector `F04` flips one nibble of the first immutable-manifest SHA in memory | nonzero; `F04 immutable_hash_mismatch` | same normal command |
| G11-F05 | selector `F05` flips one byte of the mapped archive payload before the in-memory destination hash comparison | nonzero; `F05 archive_byte_mismatch` | same normal command |
| G11-F06 | selector `F06` marks `.mcp.json` removed while its exact retained workflow row remains present | nonzero; `F06 retained_workflow_removed` | same normal command |
| G11-F07 | selector `F07` substitutes a stale Atlas SHA and an extra analyzer-scope path in the verifier copy | nonzero; `F07 atlas_receipt_or_scope` | same normal command |
| G11-F08 | selector `F08` changes one retained instrument classification to product truth/state authority | nonzero; `F08 instrument_claims_authority` | same normal command |
| G11-F09 | selector `F09` adds one protected product path to the candidate changed-path receipt | nonzero; `F09 protected_path_changed` | same normal command |
| G11-F10 | selector `F10` changes only an in-memory G11 command receipt/scope record to contain `verify-release`, package lifecycle, and `G12 ... GREEN`; it executes none of them | nonzero; `F10 g12_scope_or_receipt` | same normal command; output retains `G12 package/process status: RED — inherited; not exercised or repaired by G11` |

Every selector is mandatory. Each command must exit nonzero, then the normal
command must exit `0`. The Builder stores each unedited RED and GREEN output
and its SHA256. A selector that executes a lifecycle command, mutates a real
file, or merely checks its own environment value is invalid. F10 is solely a
static scope/receipt bait and never exercises G12 lifecycle.

## Rollback and recovery

The frozen 1,421-path denominator remains
`b1720c086bb2d93942448a3fdd352b7d58af9483` / tree
`97b2768e3bc79d45c321336e73ec30167c6c8959` and is revalidated separately.
The exact rollback comparison baseline is the five-correction amended
authority commit `81fd841828707c652eae91c98522adb9f287bc2c` / tree
`e66af95375d80071ed8c1be8506626fdde2dbc01`. The Builder records exactly one
candidate commit `<G11_CANDIDATE>` and tree `<G11_CANDIDATE_TREE>` in the
receipt; neither placeholder may remain at verification.

On RED, preserve the candidate SHA, then create a normal inverse commit—never
reset, checkout-overwrite, rebase, or force-push. Reverse only the exact
`G11-ARCHIVE-MAP.tsv` row: move the unique destination back to the unique
source, reverse its recorded exact reference rewrites, and verify the restored
source SHA256 is
`05965A70032DDB6E96B986682FCD39A7EF6773F69F499E4FA1201C353EAB6202`.
Then restore every modified A-path from the named start commit and remove only
the candidate-created G11 receipt/static-verifier paths. The rollback is green
only when `git diff --exit-code
81fd841828707c652eae91c98522adb9f287bc2c`, the separate 1,421-row/blob
reproduction against `b1720c086bb2d93942448a3fdd352b7d58af9483`, all
380 tracked immutable-manifest SHA256 rows, the external Phase-1 content check,
`doc-links`, `repo-shape`, and
`rung-ladder` agree byte-for-byte. Any collision, missing map row, ambiguous
reference, or hash mismatch stops without guessing.

## Acceptance gates and receipt contract

G11 can be offered to its independent Verifier only when all of the following
are evidenced:

- exact starting and final SHA/tree, clean starting/final worktree, and the
  complete 1,421-path starting denominator;
- changed-path manifest is entirely within the allowlist and all protected
  product/test/gate/Kernel/Canvas/R18/G12 paths are unchanged;
- `NEXT.md` names exactly `WO-GOLDEN-G11` as the active order, with no stale
  current G10 resume section; one cold read reaches one current route;
- boot/route/doc-link/repo-shape checks pass at their lowest capable tier;
- all current product/runtime claims are truthful or explicitly historical;
- all archived bytes and the G10/Phase-1/accepted-floor receipts retain their
  original hashes; no evidence was deleted or rewritten;
- every applicable falsifier has a real RED transcript and restored GREEN
  transcript;
- the inherited G12 package/process red is still recorded as RED and no
  package/operations command was used;
- one fresh semantic Reader has already returned YES/YES for this packet, and
  one independent Verifier later returns PASS for the candidate.

The Builder receipt belongs under
`docs/orders/evidence/golden-baseline/g11/`. It must link the exact starting
manifest, final diff, archive hash map, claim inventory, command receipts,
Reader decision, and independent Verifier decision. A receipt cannot become a
new authority store; `NEXT.md` and this order remain the route authority.

## Out of scope — hard stop

G11 does not implement or authorize product behavior, research semantics,
Kernel/schema changes, Canvas/Dock changes, acquisition/R18 work, existing test
or gate semantic changes beyond the one new pure static G11 verifier and its
mechanical registration, package/dependency changes, package/install/relaunch/shutdown
work, PTY prebuild work, process-root cleanup, CI/platform work, or any G12
operation. It does not alter `START_HERE.md`, `docs/DOCTRINE.md`,
`docs/LAWS.md`, `docs/DEBT.md`, the ADR record, the accepted G10 evidence, or
required immutable receipts. If the desired result needs one of those paths,
stop and return the scope question to the founder.
