# WO-GOLDEN-G11 — Authority and history compression

This order removes only proven stale instruction and history noise so a fresh
agent sees one truthful route while every required receipt remains recoverable.

status: PREPARED — READER REQUIRED; no G11 Builder authority
kind: Golden Baseline Phase 2 bounded authority/history group
owner: Router
depends: WO-GOLDEN-G10 CLOSED / independent Verifier PASS
build-authority: **CLOSED until one fresh semantic Reader returns YES / YES; this packet prepares G11 but does not implement it**
router-authority: **EVIDENCE-ONLY — may freeze identity, define the denominator, and route the next Reader; may not change product, tests, gates, Canvas, Kernel, R18, packaging, or operations**
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
| G11 authority starting commit | `a74aee915eb67b231118a00c8228b30620f89966` |
| G11 authority starting tree | `c6c47ca753169db7a6d2f0d6122984fc3ee0447b` |
| Starting checkout condition | clean worktree at the authority starting commit |

The starting authority commit contains the minimal G10 closure, the durable
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
Reader must answer both questions:

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

The G11 starting-tree denominator is the complete 1,420 tracked paths at
authority commit `a74aee915eb67b231118a00c8228b30620f89966`. The Builder must
freeze the exact path-and-SHA manifest before changing anything, using the
equivalent of:

```text
git rev-parse HEAD
git rev-parse HEAD^{tree}
git ls-files
git ls-files | Measure-Object
git ls-files -z | ForEach-Object { ... exact path SHA256 manifest ... }
```

The manifest is evidence, not a second truth store: it records the starting
Git tree and file hashes only. Every starting path belongs to exactly one of
these denominator partitions, with the named protected set taking precedence:

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
.mcp.json
```

`NEXT.md` may change only to close G10, point to this prepared G11 order, and
record the resulting route. `qf-atlas/ATLAS.md` may change only for exact-SHA
receipt wording; no analyzer, coverage, ownership, or risk capability may be
added. `.mcp.json` may be removed only after an exact current developer
workflow check proves it is unused; otherwise it remains and the decision is
recorded.

### B — authority-adjacent developer instruments (decision-only)

These surfaces may be retained, isolated, or retired only after the Builder
proves the current read-only developer workflow named in the Phase-1 health
matrix:

```text
tools/qf-vault-projection/**
collab-electron/packages/collab-canvas-skill/**
design/glacier/**
```

They are instruments, not Kernel truth, product runtime authority, or
acceptance authority. A retention decision must state the current workflow;
an uncertain workflow is not permission to delete.

### C — history and agent-context candidates (exact-manifest only)

The candidate universe is the tracked contents of `docs/orders/`,
`docs/proposals/`, `docs/research/`, and `docs/history/` that the Phase-1
packet classifies as completed, rejected, superseded, obsolete, duplicated,
or historical. The Builder must enumerate exact paths and statuses before any
move. No wildcard, directory-wide delete, parent cleanup, or inferred status
is allowed.

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

Any historical candidate that is moved must go to an explicitly named history
location, retain its original bytes, and be listed with its pre-move SHA256,
destination, and Git commit. Required G10, Phase-1, R18, and accepted-floor
receipts are not candidates for erasure.

### D — protected complement and explicit hard boundaries

Every starting path not in A, B, or the exact C manifest is protected and must
remain byte-for-byte unchanged. In particular, G11 may not touch product
packages, Kernel/schema code, Electron runtime behavior, `qa/gates/**`,
`qa/run.ts`, package scripts or dependencies, lockfiles,
`.github/workflows/**`, R18 acquisition/product paths, or any package/install,
PTY, process-root, shutdown, or relaunch surface owned by G12.

The path diff, not intent, is the gate: any changed path outside A, B, the
recorded exact C manifest, or the two G11 administration paths
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
| Vault projection | Read-only developer instrument with no named current operator duty | Retain only with a named workflow; otherwise isolate/retire with hashes |
| Canvas skill/CLI | Instrument with underdocumented boot-time external mutation | Retain only with a named current workflow; never claim product truth |
| GLACIER reference | Reference/design surface, not live product authority | Keep only if current workflow is proven; otherwise archive after hash preservation |
| G12 package/process surfaces | Inherited red is explicitly separate | G12 owns the red; G11 records it and does not repair, relabel, or rerun package proof |

The health target is one current authority path, no stale present-tense
product/runtime claim in the normal cold read, explicit historical labeling,
and recoverable evidence. G11 does not claim a product or package release.

## Bounded execution and Golden Fast Mode

The Builder may start only after the Reader gate and only from the frozen
starting identity. The execution is:

1. Freeze the exact starting matrix and path/hash manifest once. Do not refresh
   the denominator after mutation to hide a changed path.
2. Run parallel read-only preflight checks for status, diff hygiene, route,
   links, and the current claim inventory. A red preflight stops the run.
3. Make one bounded documentation/history pass under the allowlist. Preserve
   all immutable evidence and record every move by exact path and hash.
4. Run the lowest capable proof tier: registered boot/route/doc-link/repo-shape
   checks named by `bun qa/run.ts --list`, plus the fresh-agent cold read. No
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

| ID | Bait | Required RED | Restored GREEN |
|---|---|---|---|
| G11-F01 | Reintroduce a second active-order pointer or contradictory current route | route/cold-read proof reports more than one current authority path | only G11 is current and the same proof passes |
| G11-F02 | Restore a stale Claude/peer-bus/qf-toolloop or false runtime claim in README/registry | current-claim check or fresh Reader rejects the false present-tense claim | claim is corrected or explicitly historical and proof passes |
| G11-F03 | Return one archived superseded order to the active search path | cold read reports historical instruction noise or competing authority | exact archive boundary and route pass |
| G11-F04 | Remove or alter one required G10/Phase-1/accepted-floor receipt | immutable receipt/hash manifest fails closed | original bytes and SHA256 are restored and proof passes |
| G11-F05 | Change one byte in an archived file after its move | archive hash map reports a mismatch | exact bytes and recorded hash match again |
| G11-F06 | Keep `.mcp.json` removed while an exact current workflow is present, or remove it without proving absence | workflow/authority check fails closed | keep the named workflow file, or remove only after the no-workflow proof |
| G11-F07 | Reintroduce stale Atlas branch/SHA wording or expand analyzer scope | Atlas receipt check or scope diff fails | exact accepted-SHA wording and analyzer scope are restored |
| G11-F08 | Make Vault/Canvas/GLACIER claim product truth or durable state | fresh cold read identifies the instrument as false authority | instrument is read-only, explicitly scoped, or archived with proof |
| G11-F09 | Change a protected product, Kernel, Canvas, R18, test/gate, or G12 path | changed-path allowlist fails closed before acceptance | protected path is restored and the diff is clean |
| G11-F10 | Invoke package/process lifecycle work or relabel inherited G12 RED as GREEN | scope/boundary check rejects the G12 operation | G11 stops at docs/route proof and leaves G12 RED |

The Builder must paste both outputs for every falsifier that is applicable to
the chosen surface. A green-only transcript is not evidence of a gate.

## Rollback and recovery

The starting commits, manifests, and original receipts are recovery anchors.
On any new red, scope breach, uncertain workflow, missing hash, or semantic
ambiguity, stop immediately and do not continue into another surface.

- Documentation corrections are reverted by an exact Git revert of the G11
  authority commit after the failed candidate is preserved; never reset shared
  history or force-push.
- Archive moves are reversed by the recorded exact-path manifest, one path at
  a time, with the original SHA rechecked. No wildcard restore is permitted.
- A decision to retain/retire an instrument is reversible only from its
  recorded baseline bytes and workflow proof; do not delete user state or
  Kernel data.
- If the accepted G10 evidence, Phase-1 evidence, or current route cannot be
  recovered byte-for-byte, G11 is RED and G12/Phase 3 cannot inherit it.

## Acceptance gates and receipt contract

G11 can be offered to its independent Verifier only when all of the following
are evidenced:

- exact starting and final SHA/tree, clean starting/final worktree, and the
  complete 1,420-path starting denominator;
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
Kernel/schema changes, Canvas/Dock changes, acquisition/R18 work, test or gate
source changes, package/dependency changes, package/install/relaunch/shutdown
work, PTY prebuild work, process-root cleanup, CI/platform work, or any G12
operation. It does not alter `START_HERE.md`, `docs/DOCTRINE.md`,
`docs/LAWS.md`, `docs/DEBT.md`, the ADR record, the accepted G10 evidence, or
required immutable receipts. If the desired result needs one of those paths,
stop and return the scope question to the founder.
