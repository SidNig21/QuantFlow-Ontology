# WO-GOLDEN-G1-R2 — Remove exact stale generated and local authority residue

status: reader-pending
kind: non-rung Golden-Baseline purification
group: G1 of 12
supersedes: G1 drafts at `f6e5572` and `e7b2be4`
assignee: none until Reader YES/YES

## Objective and plain meaning

Remove exactly 14 tracked stale staging files and three ignored stale
authority/evidence files. Ryan and agents stop seeing old fake package output or
local Atlas-looking authority, while current production staging and product
behavior remain byte-for-byte sourced from the same canonical inputs.

## Fixed terms

- **BUILD_BASE_SHA** is the literal `order-candidate` SHA in `NEXT.md` at
  Builder delegation.
- **CANDIDATE_SHA** is the Builder's single committed result.
- **Product process** is a Windows process whose name matches
  `electron|hermes|wsl|node|bun` and whose command line names
  `QuantFlow-Ontology`, `qf-atlas`, or `hermes`.
- **Consumer roots** are tracked files under `collab-electron/src`,
  `collab-electron/scripts`, `qa`, `species`, `tools`, `packages`,
  `qf-kernel-schema`, root/package manifests, and live authority documents.
- **Current production inventory** is the full ordered JSON array printed after
  `dock-production-inventory: production=` plus the boolean
  `qaContainsClaudeCodeUngranted`; it is captured before deletion and must be
  exactly equal after deletion.

Read only `START_HERE.md`, `docs/orders/PROTOCOL.md`, this order,
`docs/adr/0004-repository-golden-baseline.md`, and `qf-atlas/ATLAS.md`.

## Exact deletion denominator

Tracked files:

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

Ignored files:

```text
docs/goals/atlas-delete-authority/goal.md
docs/goals/atlas-delete-authority/state.yaml
qf-atlas/atlas-diff.json
```

No other path belongs to G1.

## Exact evidence-file allowlist

The Builder may add only:

```text
docs/orders/evidence/golden-baseline/g1/BEFORE.md
docs/orders/evidence/golden-baseline/g1/AFTER.md
docs/orders/evidence/golden-baseline/g1/COMMANDS.tsv
docs/orders/evidence/golden-baseline/g1/logs/01-preflight.log
docs/orders/evidence/golden-baseline/g1/logs/02-consumer-search.log
docs/orders/evidence/golden-baseline/g1/logs/03-atlas-before-check.log
docs/orders/evidence/golden-baseline/g1/logs/04-atlas-before-ratchet.log
docs/orders/evidence/golden-baseline/g1/logs/05-dock-inventory-before.log
docs/orders/evidence/golden-baseline/g1/logs/06-runtime-staging-test.log
docs/orders/evidence/golden-baseline/g1/logs/07-dock-inventory-after.log
docs/orders/evidence/golden-baseline/g1/logs/08-repo-shape.log
docs/orders/evidence/golden-baseline/g1/logs/09-lockfile-committed.log
docs/orders/evidence/golden-baseline/g1/logs/10-kernel-sole-writer.log
docs/orders/evidence/golden-baseline/g1/logs/11-no-canvas-domain-writes.log
docs/orders/evidence/golden-baseline/g1/logs/12-kernel-sole-writer-app.log
docs/orders/evidence/golden-baseline/g1/logs/13-doc-action-surface.log
docs/orders/evidence/golden-baseline/g1/logs/14-one-skin.log
docs/orders/evidence/golden-baseline/g1/logs/15-doc-links.log
docs/orders/evidence/golden-baseline/g1/logs/16-rung-ladder.log
docs/orders/evidence/golden-baseline/g1/logs/17-atlas-after-check.log
docs/orders/evidence/golden-baseline/g1/logs/18-atlas-after-ratchet.log
docs/orders/evidence/golden-baseline/g1/logs/19-diff-check.log
docs/orders/evidence/golden-baseline/g1/logs/20-staged-diff-check.log
docs/orders/evidence/golden-baseline/g1/logs/21-direct-absence.log
docs/orders/evidence/golden-baseline/g1/logs/22-allowed-diff.log
docs/orders/evidence/golden-baseline/g1/logs/23-commit-show.log
docs/orders/evidence/golden-baseline/g1/logs/24-final-status.log
docs/orders/evidence/golden-baseline/g1/logs/25-process-zero.log
```

`READER-ROUND-1.md` and `READER-ROUND-2.md` already exist at BUILD_BASE_SHA and
are not Builder changes. No other evidence file is allowed.

Every numbered log contains combined stdout/stderr without edits. `COMMANDS.tsv`
has exactly 25 ordered rows with columns
`sequence,filename,command,sha,start_utc,end_utc,exit_code,log_sha256`.

## Deliverable A — Before receipt

`01-preflight.log` and `BEFORE.md` record:

1. `HEAD == BUILD_BASE_SHA`, clean status, and all target absolute paths begin
   with `C:\Users\rybow\QuantFlow-Ontology\`.
2. `git ls-files 'collab-electron/.package-staging-test/**'` equals the 14-row
   tracked denominator exactly.
3. bytes and SHA-256 for all 17 targets.
4. the one matching rule returned by
   `git check-ignore -v -- <literal-ignored-path>` for each ignored target.
5. the product-process query below returns an empty array.

```powershell
@(Get-CimInstance Win32_Process | Where-Object {
  $_.Name -match 'electron|hermes|wsl|node|bun' -and
  $_.CommandLine -match 'QuantFlow-Ontology|qf-atlas|hermes'
})
```

`02-consumer-search.log` records both searches:

```powershell
git grep -n -E 'package[-_.]?staging[-_.]?test|atlas[-_.]?delete[-_.]?authority|atlas[-_.]?diff(.json)?' -- `
  collab-electron/src collab-electron/scripts qa species tools packages qf-kernel-schema `
  '*.json' '*.md' `
  ':(exclude)docs/orders/WO-GOLDEN-G1*.md' `
  ':(exclude)docs/orders/evidence/golden-baseline/g1/**'

rg -n --hidden --no-ignore `
  'package[-_.]?staging[-_.]?test|atlas[-_.]?delete[-_.]?authority|atlas[-_.]?diff(.json)?' `
  collab-electron/src collab-electron/scripts qa species tools packages qf-kernel-schema `
  --glob '!**/.git/**' --glob '!**/node_modules/**'
```

`BEFORE.md` lists every match and classifies it as `producer`, `falsifier`, or
`consumer`. The Atlas generator/falsifier may name `atlas-diff.json`; any
`consumer`, any constructed target path, or any `.package-staging-test` match
stops G1.

Run `03` and `04` at BUILD_BASE_SHA. `BEFORE.md` records command, checked SHA,
exit code, log SHA, the full `qf-atlas: current` line, and the full ratchet line
containing `HARD RED`, `unexplained coverage`, `undecided w/o blocker`, and
`AMBER`.

Run `05-dock-inventory-before.log` and store its complete production JSON array
and QA boolean in `BEFORE.md`.

## Deliverable B — Literal removal

- `git rm --` each of the 14 tracked literal paths.
- Resolve each ignored target, reassert the repository prefix, and use one
  `Remove-Item -LiteralPath` call per file.
- Remove `docs/goals/atlas-delete-authority` only if it is empty afterward.
- A filesystem directory may disappear only when emptied by these exact file
  deletions.
- Never delete via wildcard, generated target list, unresolved variable, or
  parent sweep.
- Do not delete `node_modules`, `out`, `dist`, or `.package-staging`.
- Do not edit product code, packages, locks, tests, current staging source,
  Atlas capability, R18, or G2-G12.

## Deliverable C — Acceptance

Run logs `06` through `19` in the allowlist order. Each command must exit zero:

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

The full production JSON array and QA boolean in log `07` must exactly equal log
`05`; it must contain no target path. The runner prints
`PASS  dock-production-inventory`.

`AFTER.md` records the same exact Atlas fields as `BEFORE.md`. The two
`qf-atlas: current` lines and the ratchet counts for `HARD RED`, `unexplained
coverage`, and `undecided w/o blocker` must match before/after; exit codes are 0.

For log `21`, run literal fail-capable assertions:

```powershell
$remaining = @(git ls-files 'collab-electron/.package-staging-test/**')
if ($remaining.Count -ne 0) { throw "tracked residue remains: $($remaining -join ',')" }
$paths = @(
 'C:\Users\rybow\QuantFlow-Ontology\docs\goals\atlas-delete-authority\goal.md',
 'C:\Users\rybow\QuantFlow-Ontology\docs\goals\atlas-delete-authority\state.yaml',
 'C:\Users\rybow\QuantFlow-Ontology\qf-atlas\atlas-diff.json'
)
$present = @($paths | Where-Object { Test-Path -LiteralPath $_ })
if ($present.Count -ne 0) { throw "ignored residue remains: $($present -join ',')" }
```

Stage only the 14 deletions and exact evidence allowlist, then run
`git diff --cached --check` as log `20`. Commit once. Log `22` is
`git diff --name-status BUILD_BASE_SHA..CANDIDATE_SHA`; every row must be one of
the 14 deletions or exact evidence files above. Log `23` is
`git show --check --oneline CANDIDATE_SHA`. Log `24` is
`git status --porcelain=v1 --untracked-files=all` and must be empty. Log `25`
reruns the exact product-process query and must return an empty array.

G1 adds no reusable gate. Its new direct assertions fail on literal residue;
the registered gates are inherited regressions and need no new falsification.

## Stop and report

Stop on a consumer, path escape, denominator mismatch, active product process,
inventory delta, non-allowlisted diff, product/source edit need, or any red
command. No repair lap is authorized. No release, installer, packaged-app,
dependency cleanup, helper framework, R18, or G2 work belongs here.

Return BUILD_BASE_SHA, CANDIDATE_SHA, 14/14 and 3/3 receipts, exact
`COMMANDS.tsv`, Atlas comparison, inventory equality, allowed diff, empty final
status, process zero, and one plain-language sentence. Push `wo-golden-g1`; do
not merge or rotate `NEXT.md`.
