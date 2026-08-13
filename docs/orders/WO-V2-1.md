# WO-V2-1 — the installable product

status: open
assignee: builder
depends: R12 complete
rung: R13

## Objective

Produce an installable Windows build of the current source that a founder opens
from a desktop shortcut, containing everything through R12, with a trustworthy
gate board behind it.

## In plain terms

Right now the QuantFlow you can install is eight days old and missing the whole
research loop. This makes the app you can install the same as the app you built.
If it is wrong, you cannot judge anything else, because you cannot open the real
product.

## Context pack

- `START_HERE.md`
- `docs/orders/PROTOCOL.md`
- `docs/orders/NEXT.md`
- `docs/proposals/V2-SCOPE.md` §3 (measured baseline) and §5 (this slice, scoped)
- `collab-electron/scripts/package.mjs`
- `collab-electron/scripts/refresh-desktop-shortcut.mjs`
- `species/hermes/dock-profiles.json`, `species/claude-code/dock-profiles.json`
- `qa/gates/windows-cold-boot.ts`, `qa/gates/windows-dock-collaboration.ts`

## Deliverables

1. **Repair the gate board.** Reproduce and name the shared Bun `EPERM` failure in
   exactly these four gates: `kernel`, `typecheck`, `dock-profile-identity`,
   `kernel-one-path`. All four fail with
   `EPERM: failed copying files from cache to destination for package qf-kernel-schema`
   during the gate's own `bun install`. Apply the smallest supported toolchain
   repair. Do not delete broad caches, weaken assertions, skip installs, or swap
   frozen installs for mutable ones.

2. **Move the R13 consumer diagnostic** from
   `collab-electron/src/main/r13-consumer-workflow.check.ts` to
   `collab-electron/qa/r13-consumer-workflow.check.ts`, and update every reference
   to its old path. Do not add an allowlist exception.

   **The destination is fixed, not a choice.** `kernel-sole-writer-app` scans
   `collab-electron/src`; `kernel-one-path` scans the repo *outside*
   `collab-electron/` and already flags `join(…, "kernel.db")` literals there.
   Moving this file to `qa/` or `qa/diagnostics/` trades one red gate for another,
   and this deliverable forbids the allowlist that would silence it.
   `collab-electron/qa/` satisfies both scans without weakening either.

3. **Remove QA fixtures from the production Dock.** `claude-code-ungranted` exists
   only to be refused (`docs/orders/evidence/r4/VERIFICATION.md`). Move it to a
   QA-only inventory beside the existing deterministic proof profiles, and add a
   gate asserting the production Dock inventory contains no fixture profile.

4. **Make packaging finite.** `bun run package` must complete within a declared
   time bound and produce a Windows installer, or fail with a named cause. The
   current failure is Electron Builder stalling while traversing the Bun
   dependency tree. The artifact states its signing status honestly; obtaining a
   certificate is out of scope.

5. **Surface build identity.** The application displays the commit and build date
   it was produced from, so a founder can tell the installed product from source.

6. Record the unedited red and green transcripts in
   `docs/orders/evidence/r13/V2-1-VERIFICATION.md`.

## Contract

- Windows is the acceptance platform (ADR-0001).
- The Kernel remains the sole writer. No second truth store.
- One participant, one visible identity. No duplicate stream tile.
- The native CLI remains the tile body.
- No gate, assertion, or production-file boundary may be weakened to go green.
- No new framework, provider, orchestration engine, or execution vendor.
  Cloudflare is the execution-provider answer; Modal is rejected.
- Hermes is a moving upstream and is deliberately unpinned. Do not assume
  version-specific behaviour; any Hermes-specific workaround carries a comment
  saying it may evaporate on the next update.
- Never read, copy, print, or modify credentials. Founder Hermes config and auth
  stay untouched.
- Research only. Never place a bet or execute a trade.

## Acceptance gates

Builder runs on native Windows, pasting unedited output:

```powershell
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts kernel
bun qa/run.ts typecheck
bun qa/run.ts dock-profile-identity
bun qa/run.ts kernel-one-path
bun qa/run.ts one-skin
bun qa/run.ts rung-ladder
bun qa/run.ts repo-shape
bun qa/run.ts doc-links
git diff --check
```

Verifier repeats these cold in a fresh detached worktree, then runs
`bun qa/run.ts windows-cold-boot` and `bun qa/run.ts windows-dock-collaboration`,
and produces an installer from a clean checkout.

**Measured red baseline, 2026-08-12 on native Windows at `9b24289`** — paste
alongside the post-repair run:

```
FAIL  kernel                 (EPERM install)
FAIL  typecheck              (EPERM install)
FAIL  dock-profile-identity  (EPERM install)
FAIL  kernel-one-path        (EPERM install)
FAIL  kernel-sole-writer-app (scan offender: collab-electron/src/main/r13-consumer-workflow.check.ts)
```

## Falsification

Every gate this order adds or repairs must be shown red on purpose, restored, and
shown green. Both transcripts go in the evidence file.

- Restore `claude-code-ungranted` to the production inventory → the new Dock
  inventory gate goes red.
- Move the check harness back into `collab-electron/src/main/` →
  `kernel-sole-writer-app` goes red.
- Add a raw hex value to any window stylesheet → `one-skin` goes red.
- Point a packaged seat at a foreign kernel database →
  `windows-dock-collaboration` refuses.

## Founder acceptance

The founder installs from the produced installer, opens it from the desktop, sees
the build identity, sees `hermes-critic` in the Dock, sees no `ungranted` card,
spawns one seat, reads `5 tools · 0 skills` in the TUI, closes the app, and finds
no leftover processes.

## Out of scope

The first-action stall. Any UI redesign. Task creation or assignment. Cables.
Research-object projections. Obtaining a signing certificate. R14–R18. Betting or
trading.

## Report back

Return the commit SHA, the exact failing cause of each repaired gate, the exact
repair, every command result unedited, the falsification transcripts, the
installer path and its signing status, and any remaining red gate. Stop after
this order; do not begin `WO-V2-2` automatically.
