# WO-GOLDEN-G1 — Remove exact stale generated and local authority residue

status: reader-pending
kind: non-rung Golden-Baseline purification
group: G1 of 12
assignee: none until Reader YES/YES
depends: ADR-0004 and Phase-1 independent PASS at audited SHA `5882ab2`

## Objective

Remove only the exact tracked staging residue and ignored stale authority/evidence
identified by the read-only audit, then prove current runtime staging is regenerated
from canonical tracked inputs.

## In plain terms

QuantFlow currently carries about 22.7 MB of old fake package output plus local
files that look like current Atlas authority; this order removes those exact
fossils without touching the working product or its real package inputs.

## Context pack

Read only:

1. `START_HERE.md`;
2. `docs/orders/PROTOCOL.md`;
3. `docs/adr/0004-repository-golden-baseline.md`;
4. `qf-atlas/ATLAS.md`;
5. the immutable audit receipt outside the repository:
   `C:\Users\rybow\Obsidian\QuantFlow Vault\2026-08-24\QuantFlow Repository Golden Baseline 5882ab2\phase-1-audit\FINAL-PHASE-1-RECEIPT.md`.

Do not read later Golden group plans, R18 implementation prose, or historical
orders to infer more scope.

## Deliverable A — Before-deletion receipt

Create `docs/orders/evidence/golden-baseline/g1/BEFORE.md` containing:

- candidate base SHA;
- literal path, byte size, and SHA-256 for every tracked file below;
- literal path, byte size, SHA-256, resolved absolute path, and Git-ignore rule
  for each ignored file below;
- `git grep` and `rg --hidden` results proving no current source, package script,
  runtime, QA registry, or current authority consumes the tracked staging tree or
  ignored stale files;
- process census proving no QuantFlow/Electron/Hermes process owns a target;
- resolved-path proof that every target is inside
  `C:\Users\rybow\QuantFlow-Ontology`.

The tracked deletion denominator is exactly these 14 files:

```text
collab-electron/.package-staging-test/species/hermes/dock-profiles.json
collab-electron/.package-staging-test/species/hermes/launch.json
collab-electron/.package-staging-test/species/hermes/packed/hermes.aospkg
collab-electron/.package-staging-test/species/hermes/packed/hermes.meta.json
collab-electron/.package-staging-test/species/hermes/tools-allowlist.json
collab-electron/.package-staging-test/tools/qf-proof-agent/dock-profiles.json
collab-electron/.package-staging-test/tools/qf-proof-agent/launch.json
collab-electron/.package-staging-test/tools/qf-proof-agent/packed/qf-proof-agent.aospkg
collab-electron/.package-staging-test/tools/qf-proof-agent/packed/qf-proof-agent.meta.json
collab-electron/.package-staging-test/tools/qf-proof-agent/packed/qf-proof-agent.mjs
collab-electron/.package-staging-test/tools/runtime-proof/dock-profiles.json
collab-electron/.package-staging-test/tools/runtime-proof/launch.json
collab-electron/.package-staging-test/tools/runtime-proof/packed/qf-toolloop.aospkg
collab-electron/.package-staging-test/tools/runtime-proof/packed/qf-toolloop.meta.json
```

The ignored local deletion denominator is exactly:

```text
docs/goals/atlas-delete-authority/goal.md
docs/goals/atlas-delete-authority/state.yaml
qf-atlas/atlas-diff.json
```

If any target is consumed, outside the repository, missing from the expected
denominator, or held by a product process, stop. Do not reinterpret the group.

## Deliverable B — Exact removal

- Delete the 14 tracked files by their literal paths and remove their now-empty
  tracked directories.
- Delete the three ignored files by literal resolved path. Remove
  `docs/goals/atlas-delete-authority` only if it is empty after those two file
  deletions.
- Do not use a wildcard, glob, parent-directory sweep, generated path list, or
  unresolved environment variable.
- Do not delete `node_modules`, `collab-electron/out`,
  `collab-electron/dist`, or `collab-electron/.package-staging` in this Builder
  order. Their clean regeneration belongs to the future frozen Phase-3 run; the
  standing one-checkout rule forbids destructive dependency cleanup here.
- Do not edit product code, package declarations, locks, Atlas capability,
  current staging source, tests, or R18.

The ignored-file deletion is recorded in evidence but is not a Git diff. The
tracked staging deletion and evidence files are the only expected repository
changes.

## Deliverable C — Current staging proof

Prove that current production staging is generated from canonical tracked inputs
and does not read `.package-staging-test`:

```powershell
bun test collab-electron/scripts/package-lib/runtime-staging.test.ts
bun qa/run.ts dock-production-inventory
```

Store unedited outputs under
`docs/orders/evidence/golden-baseline/g1/logs/`. The focused staging test must
fail against a temporary copy whose canonical tracked input is deliberately
missing, then pass after restoration. The control must not modify the candidate
tree or weaken an assertion.

## Acceptance gates

Run in this order:

```powershell
bun test collab-electron/scripts/package-lib/runtime-staging.test.ts
bun qa/run.ts dock-production-inventory
bun qa/run.ts repo-shape
bun qa/run.ts lockfile-committed
bun qa/run.ts kernel-sole-writer
bun qa/run.ts no-canvas-domain-writes
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts doc-action-surface
bun qa/run.ts one-skin
bun qa/run.ts doc-links
bun qa/run.ts rung-ladder
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
git diff --check
git diff --cached --check
```

Then assert:

```text
tracked .package-staging-test paths remaining = 0
the three ignored stale files present = 0
current production staging inventory = PASS
unexpected repository changes = 0
owned product processes = 0
```

No release, installer, packaged-Windows, full verification, dependency deletion,
or new test-running helper belongs to G1.

## Out of scope

- G2–G12;
- product, schema, Kernel, Canvas, Dock, Report, runtime, adapter, or package
  behavior changes;
- AgentOS, ACP, Claude, peer bus, critic mock, or dependency removal;
- current historical-document compression;
- R18 or later-rung work;
- deletion of any path not literally listed above.

## Stop conditions

Stop and report rather than widen scope if:

- a target has a current consumer or package inclusion;
- the exact denominator differs;
- a deletion requires a parent/wildcard operation;
- a current staging gate fails for a reason other than stale residue;
- any product process is active on a target;
- a product/source edit appears necessary;
- the same acceptance assertion remains red after one bounded correction.

## Report back

Return:

```text
candidate SHA
tracked files removed: 14/14 with manifest receipt
ignored files removed: 3/3 with manifest receipt
unexpected changes: 0
staging falsifier: RED then GREEN
acceptance command / exit / log SHA table
Atlas before/check/ratchet summary
owned product processes remaining: 0
plain language: what stale material is no longer able to mislead Ryan or an agent
```

Commit and push `wo-golden-g1`. Do not merge, rotate `NEXT.md`, or start G2.
