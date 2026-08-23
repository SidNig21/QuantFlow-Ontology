# Documentation correction receipt

Date: 2026-08-23  
Branch: `wo-pre-r18-coherence`  
Parent: `2bb828c`  
Scope: the four named documentation paths only.

## Old claims removed

- `qf-atlas/AGENT_BOOT.md` said independent acceptance was pending, the two
  authority receipts were absent, and Atlas was not yet authoritative for repair.
- `qf-atlas/OPERATING_MANUAL.md` repeated the pending/absent status in its
  snapshot table and authority block.
- `docs/PRODUCT.md` claimed every pointer action had keyboard parity.

## New claims

The Atlas status is exactly:

> Capability work: CLOSED; independent acceptance: PASS; founder acceptance:
> recorded in qf-atlas/verification.json; baseline: present; Atlas authorizes
> diagnosis and blast-radius analysis, not product repair or deletion.

The product contract now requires normal text and terminal input after explicit
mouse focus, forbids trapped focus, and points global keyboard-navigation parity
to `docs/DEBT.md` item 38 as pre-release debt.

## Authority receipts

- `qf-atlas/verification.json` exists and records the independent PASS plus
  founder acceptance.
- `qf-atlas/baseline.json` exists and records the accepted baseline findings.
- `docs/DEBT.md` item 38 is the authority for deferred global keyboard parity.

## Focused semantic check

Run after this commit is created:

```powershell
$ErrorActionPreference = 'Stop'
$expected = @(
  'qf-atlas/AGENT_BOOT.md',
  'qf-atlas/OPERATING_MANUAL.md',
  'docs/PRODUCT.md',
  'docs/orders/evidence/pre-r18-coherence/DOCUMENTATION-CORRECTION.md'
)
$changed = @(git diff --name-only HEAD^ HEAD)
if ((Compare-Object $expected $changed).Count -ne 0) { throw "docs-only scope failed: $($changed -join ', ')" }
$status = 'Capability work: CLOSED; independent acceptance: PASS; founder acceptance: recorded in qf-atlas/verification.json; baseline: present; Atlas authorizes diagnosis and blast-radius analysis, not product repair or deletion.'
foreach ($path in @('qf-atlas/AGENT_BOOT.md', 'qf-atlas/OPERATING_MANUAL.md')) {
  if (-not (Select-String -Path $path -SimpleMatch $status -Quiet)) { throw "status missing: $path" }
}
if (Select-String -Path qf-atlas/AGENT_BOOT.md,qf-atlas/OPERATING_MANUAL.md -Pattern 'Independent acceptance:.*PENDING|baseline\.json.*absent|not yet.*authority' -Quiet) { throw 'stale Atlas claim remains' }
if (Select-String -Path docs/PRODUCT.md -SimpleMatch 'Every pointer action has keyboard parity' -Quiet) { throw 'stale keyboard-parity claim remains' }
if (-not (Select-String -Path docs/PRODUCT.md -SimpleMatch 'docs/DEBT.md` item 38' -Quiet)) { throw 'Debt item 38 pointer missing' }
if (-not (Test-Path qf-atlas/verification.json)) { throw 'verification receipt missing' }
if (-not (Test-Path qf-atlas/baseline.json)) { throw 'baseline receipt missing' }
'PASS documentation semantic check'
```

Observed output on commit `c7cc49e`:

```text
PASS documentation semantic check
CHANGED docs/PRODUCT.md, docs/orders/evidence/pre-r18-coherence/DOCUMENTATION-CORRECTION.md, qf-atlas/AGENT_BOOT.md, qf-atlas/OPERATING_MANUAL.md
```
