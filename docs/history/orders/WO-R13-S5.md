> **SUPERSEDED 2026-08-12.** The R13 slice plan was replaced by the V2 ladder in
> [../../proposals/V2-SCOPE.md](../../proposals/V2-SCOPE.md). Its work is not
> discarded: S1 and S5 became [WO-V2-1](../../orders/WO-V2-1.md) (installable
> product plus gate-board repair), and S2, S3 and S4 became WO-V2-2 (measure
> the first Hermes turn, fix the named cause, founder run). Kept for its
> reasoning and its measured baselines. Not authority.
# WO-R13-S5 â€” finite Windows installer and signing status

status: open
assignee: builder
depends: WO-R13-S4

> Not authorized until `NEXT.md` names this order.

## Objective

Produce a finite Windows release artifact whose signature state is explicit and whose installed app preserves the accepted R13 workflow.

## In plain terms

Turn the accepted app into something the founder can install, identify, and launch without a hanging build or an ambiguous security state.

## Context pack

- `docs/orders/WO-R13-S4.md`
- R13 founder acceptance evidence
- `collab-electron/electron-builder.yml`
- `.github/workflows/packaged-app.yml`
- existing package-build helpers and signing configuration

## Deliverables

1. Measure the current Electron Builder finalization stall on native Windows and name the exact phase/process that does not terminate.
2. Apply the smallest supported packaging/toolchain repair. Preserve frozen dependencies and all packaged-app gates.
3. Produce the installer and unpacked application with version, source commit, SHA-256, and Authenticode status in the release evidence.
4. If a signing identity is available through the existing secure release environment, sign and verify the installer. If none is available, stop for the founder's explicit ship-unsigned decision; do not invent, extract, or weaken signing.
5. Install, launch, and uninstall/reinstall on Windows, then confirm the S4 accepted workflow's durable state and upgrade/reopen behavior are not damaged.

## Contract

- Windows is canonical; no WSL/Linux substitute counts.
- No disabled package gates, mutable installs, copied credentials, or fabricated signing status.
- The package command must have a declared finite deadline and clean every owned process on failure.
- Keep the accepted GLACIER/native-TUI consumer experience unchanged.

## Acceptance gates

- Electron Builder exits successfully within the declared bound.
- The generated executable launches and the real packaged gate completes.
- Both repository CI workflows pass at the exact release SHA.
- `bun qa/verify-release.ts`, installer install/launch, `Get-AuthenticodeSignature`, hash verification, and close/reopen verification are recorded in `docs/orders/evidence/r13-s5/VERIFICATION.md`.

## Out of scope

New product features, R14, RL, model routing, cloud deployment, bets, and trades.

## Report back

Return the release SHA, artifact paths/hashes, build duration, signature status, install/launch evidence, and CI links. If unsigned, request the founder's explicit decision and stop.
