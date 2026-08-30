# Rejected Phase-3 execution source — canonical install closure

In plain terms: the two agent consumers installed and tested correctly, but the canonical route reached the existing G12 Bovada tests without installing Bovada's own package root, so its Kernel dependency could not resolve.

status: **REJECTED RED / IMMUTABLE / NOT A CANDIDATE**
commit: `ca48db40ab4a926460ffbbb7196e5ad52590feb1`
tree: `846e88427f654bbedc450ec448b1d1abc44c2ab6`
sole-parent: `9c709c58e5053460233b2aa630fb795ae9d1248a`
archive-sha256: `59E67BE6267FE728B40F80CAE46CC5C1B11E39D45633D0C4B0DAB8463A1B57DF`
canonical-red-log-sha256: `5CB1786DC7A8B17C06258687357845F91E48FDD9A61F263FA22C688E79952C3A`
shared-cache-eperm-receipt-sha256: `822E645D2C5795FAD0514EA41BD3022AC141F74589B3EBD4BA78A4A2D9900EEA`
distinct-cache-eperm-receipt-sha256: `249D22D2395F7FC0E52428AED1742B5D7EC348170F051D0D69D39DBB8CB9DF49`

## Measured boundary

- The shared-cache and then distinct-cache receipts above preserve the Windows EPERM diagnosis; distinct run-owned caches are required per preinstall root.
- Hermes `--linker isolated` is the measured correction that retains direct host-ACP source resolution without aliases or source movement.
- `qa/windows-unit.ts` completed `62 pass / 0 fail`.
- Native-TUI admission and detached shutdown passed.
- Atlas reported `HARD RED 0`.
- Final cleanup reported `roots_remaining=0`, owned Bun processes `0`, and owned Electron processes `0`.
- The canonical release route then reached the existing G12 Bovada package tests and failed because `tools/qf-bovada-football` could not resolve direct package `qf-kernel`, module `qf-kernel/portable`, from the clean archive. This is an install-root omission, not a Kernel, Bovada, package-manifest, lockfile, or behavior defect.

The authorized correction adds no dependency or workspace. It preinstalls exactly the three consumer roots before `windows-unit` and later consumers: Electron frozen; Hermes frozen with isolated linker; Bovada frozen with copyfile backend and isolated linker. All three manifests/locks remain byte-identical and the dependency denominator remains 104.

This source and all hashes above remain immutable rejected evidence. It is never reused as a Phase-3 execution source or candidate.
