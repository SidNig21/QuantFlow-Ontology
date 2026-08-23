# Pre-R18 coherence baseline byte equivalence

Date: 2026-08-23
Branch: `wo-pre-r18-coherence`
Closure head: `4d25fa3df91964fc90223a135d8969ebd61c5374`
Accepted R17 product candidate: `83cb58501670ec5e5551ed9a45b5f54aa038261a`
Status: **PASS**

## Plain-language result

The accepted R17 application is the application this correction starts from.
The commits after the accepted candidate changed only route and evidence prose;
they did not change any product, UI, gate, schema, species, or tool byte.

## Compared surface

The product manifest is every tracked Git entry except `docs/**` and the root
`README.md`. This deliberately includes the Electron application, renderer,
Kernel packages, schemas, QA gates, Atlas implementation, species adapters,
tools, design assets, repository configuration, lockfiles, and workflows.

Each manifest line is Git's exact `mode type object-id<TAB>path` record. The
receipt hashes the UTF-8 manifest with LF separators and one final LF. Equal
manifests therefore prove equal tracked paths, modes, and blob or tree object
IDs across the complete compared surface.

## Receipt

```yaml
accepted: 83cb58501670ec5e5551ed9a45b5f54aa038261a
closure: 4d25fa3df91964fc90223a135d8969ebd61c5374
accepted_manifest_entries: 805
closure_manifest_entries: 805
accepted_manifest_sha256: e71307d21ac52fac8a023502fe9d8d136b243c8745bba2b224dc877c3e05e0c3
closure_manifest_sha256: e71307d21ac52fac8a023502fe9d8d136b243c8745bba2b224dc877c3e05e0c3
manifests_byte_equal: true
non_doc_diff_count: 0
git_diff_exit: 0
```

## Reproduction

Run from the repository root in PowerShell:

```powershell
$accepted = '83cb58501670ec5e5551ed9a45b5f54aa038261a'
$closure = '4d25fa3df91964fc90223a135d8969ebd61c5374'

function Get-ProductManifest([string]$commit) {
  @(git ls-tree -r --full-tree $commit | Where-Object {
    $tab = $_.IndexOf("`t")
    if ($tab -lt 0) { return $false }
    $path = $_.Substring($tab + 1)
    -not ($path -eq 'README.md' -or $path.StartsWith('docs/'))
  })
}

function Get-Sha256([string[]]$lines) {
  $text = ($lines -join "`n") + "`n"
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    ([System.BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-', '').ToLowerInvariant()
  } finally {
    $sha.Dispose()
  }
}

$acceptedManifest = Get-ProductManifest $accepted
$closureManifest = Get-ProductManifest $closure
Get-Sha256 $acceptedManifest
Get-Sha256 $closureManifest

git diff --exit-code --quiet $accepted $closure -- . `
  ':(exclude)README.md' ':(exclude)docs/**'
"git_diff_exit=$LASTEXITCODE"
```

Expected: both hashes equal the receipt above and `git_diff_exit=0`.

## Baseline ruling

All visual and behavioral comparisons for the bounded pre-R18 coherence
correction use the accepted R17 product bytes at `83cb585…`. The closure head
is safe as the branch point because its complete non-document product manifest
is byte-identical.
