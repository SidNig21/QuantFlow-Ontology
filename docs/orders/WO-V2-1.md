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

## Pre-build adversarial read

Completed 2026-08-13 by a fresh Reader session that did not author this order
(`019ffb58-8347-7952-b4e4-437fb4a53f02`). The read found that the original
order could pass without proving the installer, production-only Dock inventory,
build identity, or ordinary Hermes fallback policy. It also found two invalid
falsifiers and an empty post-commit `git diff --check`. The corrected contracts
below are the landed defects; chat guidance is not authority.

## Deliverables

1. **Repair the gate board.** Reproduce and name the shared Bun `EPERM` failure in
   exactly these four gates: `kernel`, `typecheck`, `dock-profile-identity`,
   `kernel-one-path`. All four fail with
   `EPERM: failed copying files from cache to destination for package qf-kernel-schema`
   during the gate's own `bun install`. The repair seam is the shared frozen
   package-install orchestration in `qa/run.ts` and the four named gates; do not
   change the pinned Bun version, package dependencies, or lockfiles as a repair.
   Do not delete any shared/global cache, weaken assertions, skip installs, swap
   frozen installs for mutable ones, or hide the failure behind an unbounded
   retry. A retry is permitted only if it is bounded, reports the original
   Windows error and exhausted attempt count, and has a deterministic test that
   proves permanent copy failures still fail. If the reproduced cause cannot be
   repaired inside this seam, stop and report an order defect rather than
   widening scope.

2. **Move the R13 consumer diagnostic** from
   `collab-electron/src/main/r13-consumer-workflow.check.ts` to
   `collab-electron/qa/r13-consumer-workflow.check.ts`, and update every reference
   to its old path. "Every reference" means each tracked, non-history
   code/config/test reference returned by
   `git grep -n "collab-electron/src/main/r13-consumer-workflow.check.ts"`;
   historical evidence remains unchanged. Do not add an allowlist exception.

   **The destination is fixed, not a choice.** `kernel-sole-writer-app` scans
   `collab-electron/src`; `kernel-one-path` scans the repo *outside*
   `collab-electron/` and already flags `join(…, "kernel.db")` literals there.
   Moving this file to `qa/` or `qa/diagnostics/` trades one red gate for another,
   and this deliverable forbids the allowlist that would silence it.
   `collab-electron/qa/` satisfies both scans without weakening either.

3. **Remove QA fixtures from the production Dock.** `claude-code-ungranted` exists
   only to be refused (`docs/orders/evidence/r4/VERIFICATION.md`). Remove it from
   `species/claude-code/dock-profiles.json`, place the unchanged profile in the
   new manifest `species/claude-code/qa-dock-profiles.json`, and add that manifest
   only to `QA_DOCK_PROFILE_MANIFESTS` in
   `collab-electron/src/main/dock-profiles.ts`. Add the registered gate
   `dock-production-inventory`; it must load the deploy-true production manifest
   closure and fail if any production profile id or role contains `fixture`,
   `proof`, `test`, or `ungranted`, while confirming the QA-mode closure still
   contains `claude-code-ungranted`.

4. **Make packaging finite.** From `collab-electron`, `bun run package:unsigned`
   must finish within 10 minutes on the verifier's native Windows machine and
   produce the configured x64 NSIS installer under `collab-electron/dist/` plus
   `dist/RELEASE-STATUS.json`, or exit non-zero within that bound with the last
   active packaging phase and cause printed. Add the registered gate
   `windows-installer`; it enforces the 10-minute deadline, requires exactly one
   NSIS installer for the package name/version, checks its Authenticode status is
   `NotSigned`, checks `RELEASE-STATUS.json` names the same installer and signing
   state, installs it silently into an isolated temporary per-user directory,
   launches that installed executable to readiness, requests clean shutdown, and
   proves no process owned by that install remains. The current failure is
   Electron Builder stalling while traversing the Bun dependency tree. Obtaining
   a certificate is out of scope.

5. **Surface build identity.** The existing shell alpha masthead displays the
   full 40-character `git rev-parse HEAD` and an ISO-8601 UTC packaging timestamp
   injected by the package command. The installer gate compares the displayed
   values reported by the packaged app with the exact build inputs; a dirty
   checkout must make packaging fail rather than display a misleading commit.

6. **Close the ordinary Hermes policy escape.** Every exec branch in
   `collab-electron/cli/qf-hermes-launch.sh` must pass exactly
   `--toolsets mcp-quantflow-collaboration,mcp-quantflow-ontology`. Change the
   plain fallback to pass that allowlist. Preserve the metadata-supplied `--tui`
   already present in `$@`; do not add a second literal `--tui`. Add the
   registered gate `hermes-launch-policy`, which invokes all four branches with
   an argv-capturing fake Hermes command and asserts the allowlist occurs once
   and `--tui` occurs once on each path.

7. Record the unedited red and green transcripts in
   `docs/orders/evidence/r13/V2-1-VERIFICATION.md`. Use one heading per command
   with commit SHA, environment, exact command, exit code, complete output, red
   mutation, restoration, and green rerun. Record the installer path,
   Authenticode result, installed executable path, build-identity values, and the
   founder steps separately; file existence without these fields is not
   acceptance evidence.

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
bun qa/run.ts dock-production-inventory
bun qa/run.ts kernel-one-path
bun qa/run.ts hermes-launch-policy
bun qa/run.ts one-skin
bun qa/run.ts rung-ladder
bun qa/run.ts repo-shape
bun qa/run.ts doc-links
git diff --check
```

Verifier repeats these cold in a fresh detached worktree, then runs the
canonical release door and the package-specific gates:

```powershell
bun qa/verify-release.ts
bun qa/run.ts windows-cold-boot
bun qa/run.ts windows-dock-collaboration
bun qa/run.ts windows-installer
git diff --check origin/wo-r9-research-integrity...HEAD
git diff --check
```

`windows-cold-boot` proves the unpacked package; it does not substitute for the
installed-artifact proof in `windows-installer`.

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

- Restore `claude-code-ungranted` to `species/claude-code/dock-profiles.json` →
  `dock-production-inventory` goes red; restore the split → green.
- Move the check harness back into `collab-electron/src/main/` →
  `kernel-sole-writer-app` goes red.
- Add `#123456` to the non-exempt
  `collab-electron/src/windows/shell/src/shell.css` → `one-skin` goes red.
- Invoke the existing `windows-dock-collaboration` delivery-off bait → the task
  delivery proof goes red; restore normal delivery → green.
- Remove `--toolsets "$quantflow_toolsets"` from only the fallback exec →
  `hermes-launch-policy` goes red; restore it → green.
- Feed `windows-installer` a copied installer whose recorded build SHA differs
  from the expected SHA → red; restore the produced artifact → green.
- Exercise the shared package-install helper with its deterministic permanent
  copy-failure bait → each of the four repaired gates reports the copy cause and
  exits non-zero; restore the real installer → all four green.

## Founder acceptance

The founder installs from the produced NSIS installer on a Windows account that
has never run this checkout, opens the installed desktop shortcut, and confirms
the masthead's full commit equals the builder commit and its UTC build timestamp
equals `RELEASE-STATUS.json`. The founder sees `hermes-critic` in the Dock and no
profile whose id or role contains `ungranted`. The founder then spawns
`hermes-critic` directly from the ordinary Dock with no mission or task
activation, confirms the native TUI opens and reports `5 tools · 0 skills`,
closes QuantFlow, and confirms the verifier's process check reports zero
processes owned by the install.

### Resolved launcher decision

Every QuantFlow product seat is restricted to the two app-owned MCP toolsets.
The direct-Dock fallback was the only escape and must gain `--toolsets`; it is
not a deliberately general-purpose seat. The fallback must not add a literal
`--tui`, because `species/hermes/launch.json` and the packed metadata already
supply `argv: ["--tui"]`, runtime expansion preserves it, and the host appends it
to `$@`. This decision was independently read and traced through the packaged
resource copy, resolver, runtime expansion, and host command assembly in Reader
task `019ffb58-8347-7952-b4e4-437fb4a53f02`.

## Out of scope

The first-action stall. Any UI redesign. Task creation or assignment. Cables.
Research-object projections. Obtaining a signing certificate. R14–R18. Betting or
trading.

## Report back

Return the commit SHA, the exact failing cause of each repaired gate, the exact
repair, every command result unedited, the falsification transcripts, the
installer path and its signing status, and any remaining red gate. Stop after
this order; do not begin `WO-V2-2` automatically.
