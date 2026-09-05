# WO-GOLDEN-G1-R1 — Remove exact stale generated and local authority residue

status: reader-pending
kind: non-rung Golden-Baseline purification
group: G1 of 12
supersedes: `WO-GOLDEN-G1.md` draft at `f6e5572`
assignee: none until Reader YES/YES

## Objective

Remove exactly 14 tracked stale staging files and three ignored stale
authority/evidence files, then prove current production staging and repository
invariants are unchanged.

## In plain terms

Old fake package output and stale local Atlas-looking files stop misleading Ryan
or an agent, while the real package inputs and current app remain untouched.

## Terms with one meaning

- **BUILD_BASE_SHA** — the literal `order-candidate` SHA written into `NEXT.md`
  by the Router after Reader YES/YES and before Builder delegation;
- **CANDIDATE_SHA** — the Builder's one committed result after all acceptance
  commands pass;
- **product process** — a Windows process whose name matches
  `electron|hermes|wsl|node|bun` and whose command line names
  `QuantFlow-Ontology`, `qf-atlas`, or `hermes`;
- **current consumer** — a tracked source, package manifest/script, QA registry,
  or live authority document outside this order and its G1 evidence directory
  that reads or selects a target;
- **current production staging** — the temporary staging root created by
  `dock-production-inventory` from canonical tracked runtime definitions via
  `prepareRuntimeStaging`; it is not `.package-staging-test`.

## Context pack

Read only `START_HERE.md`, `docs/orders/PROTOCOL.md`, this order,
`docs/adr/0004-repository-golden-baseline.md`, and `qf-atlas/ATLAS.md`.

## Exact target denominator

The tracked denominator is exactly:

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

The ignored denominator is exactly:

```text
docs/goals/atlas-delete-authority/goal.md
docs/goals/atlas-delete-authority/state.yaml
qf-atlas/atlas-diff.json
```

No other path belongs to G1.

## Deliverable A — Exact before receipt

Create `docs/orders/evidence/golden-baseline/g1/BEFORE.md` and record unedited
output from these checks:

1. `git rev-parse HEAD` equals BUILD_BASE_SHA and the worktree is clean.
2. `git ls-files 'collab-electron/.package-staging-test/**'` returns exactly the
   14 literal paths above, no more and no fewer.
3. `Get-Item` and `Get-FileHash -Algorithm SHA256` record bytes and hashes for
   every target.
4. `git check-ignore -v -- <literal-path>` records every matching ignore rule
   for each ignored target.
5. This tracked-consumer search exits 1 with no output after excluding this
   order and its evidence:

```powershell
git grep -n -F '.package-staging-test' -- `
  ':(exclude)docs/orders/WO-GOLDEN-G1.md' `
  ':(exclude)docs/orders/WO-GOLDEN-G1-R1.md' `
  ':(exclude)docs/orders/evidence/golden-baseline/g1/**'
```

6. `git grep -n -F 'atlas-delete-authority'` may match only G1 order/evidence
   text. `git grep -n -F 'atlas-diff.json'` may additionally match the Atlas
   producer/falsifier. `BEFORE.md` lists every match and labels it
   `order-evidence`, `producer`, `falsifier`, or `consumer`; any `consumer`
   stops G1.
7. This process query returns an empty array:

```powershell
@(Get-CimInstance Win32_Process | Where-Object {
  $_.Name -match 'electron|hermes|wsl|node|bun' -and
  $_.CommandLine -match 'QuantFlow-Ontology|qf-atlas|hermes'
})
```

8. Resolve every target to an absolute path and assert it starts with
   `C:\Users\rybow\QuantFlow-Ontology\`. Any escape or missing denominator
   stops the order.

## Deliverable B — Exact removal

- Remove each of the 14 tracked files by its literal path using `git rm --`.
- Remove each ignored file individually with `Remove-Item -LiteralPath` only
  after its resolved-path assertion passes.
- Remove `docs/goals/atlas-delete-authority` only if it is empty afterward.
- Filesystem directories left empty by these listed deletions may disappear;
  no other directory may be removed.
- Never use a wildcard, glob-derived deletion target, parent sweep, unresolved
  variable, or recursive deletion outside the exact now-empty target tree.
- Do not delete `node_modules`, `collab-electron/out`,
  `collab-electron/dist`, or `collab-electron/.package-staging`.
- Do not edit product code, package declarations, locks, tests, Atlas
  capability, current staging source, R18, or G2-G12.

## Deliverable C — Fail-capable G1 delta proof

Run these literal assertions after removal; each must throw if its claim is
false:

```powershell
$remaining = @(git ls-files 'collab-electron/.package-staging-test/**')
if ($remaining.Count -ne 0) { throw "tracked staging residue remains: $($remaining -join ',')" }

$ignored = @(
  'C:\Users\rybow\QuantFlow-Ontology\docs\goals\atlas-delete-authority\goal.md',
  'C:\Users\rybow\QuantFlow-Ontology\docs\goals\atlas-delete-authority\state.yaml',
  'C:\Users\rybow\QuantFlow-Ontology\qf-atlas\atlas-diff.json'
)
$present = @($ignored | Where-Object { Test-Path -LiteralPath $_ })
if ($present.Count -ne 0) { throw "ignored stale residue remains: $($present -join ',')" }
```

`bun qa/run.ts dock-production-inventory` must exit 0 and print one
`dock-production-inventory:` row whose production JSON contains no id/role
matching `fixture|proof|test|ungranted` and whose
`qaContainsClaudeCodeUngranted=true`. The runner must print
`PASS  dock-production-inventory`.

G1 adds no reusable gate. Under `PROTOCOL.md`, inherited registered gates do
not need new RED→GREEN transcripts. The two direct assertions above are the
new G1 acceptance and are fail-capable by literal target presence.

## Logs and allowed candidate diff

Store stdout and stderr together, unedited, in these files and record command,
start/end UTC, exit code, and log SHA-256 in `COMMANDS.tsv`:

```text
01-runtime-staging-test.log
02-dock-production-inventory.log
03-repo-shape.log
04-lockfile-committed.log
05-kernel-sole-writer.log
06-no-canvas-domain-writes.log
07-kernel-sole-writer-app.log
08-doc-action-surface.log
09-one-skin.log
10-doc-links.log
11-rung-ladder.log
12-atlas-check.log
13-atlas-ratchet.log
14-diff-check.log
15-direct-absence.log
16-process-zero.log
```

The only CANDIDATE_SHA changes after BUILD_BASE_SHA may be:

- deletion of the 14 literal tracked targets;
- files below `docs/orders/evidence/golden-baseline/g1/`.

The Builder prints `git diff --name-status BUILD_BASE_SHA..CANDIDATE_SHA`; the
Verifier compares every row to that allowlist. Any other row is red. Ignored
file deletion appears only in the before/after evidence and direct assertion.

## Acceptance sequence

Before edits, run and retain:

```powershell
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
```

After exact removal, run in order:

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
```

Stage only the allowlisted tracked changes and evidence, run
`git diff --cached --check`, commit once, then run:

```powershell
git show --check --oneline CANDIDATE_SHA
git status --porcelain=v1 --untracked-files=all
```

The status output must be empty. Repeat the direct absence and process-zero
assertions at CANDIDATE_SHA.

No release, installer, packaged-app, dependency deletion, helper framework, or
full verification matrix belongs to G1.

## Stop conditions

Stop on a consumer, denominator mismatch, path escape, active product process,
non-allowlisted diff, product/source edit need, or any red acceptance command.
No repair lap is authorized for G1; an unexpected red returns to the Router for
adjudication.

## Report back

Return BUILD_BASE_SHA, CANDIDATE_SHA, exact 14/14 and 3/3 receipts, the complete
`COMMANDS.tsv`, allowed diff, before/after Atlas summaries, empty final status,
process zero, and one plain-language sentence. Commit and push
`wo-golden-g1`. Do not merge, rotate `NEXT.md`, or begin G2.
