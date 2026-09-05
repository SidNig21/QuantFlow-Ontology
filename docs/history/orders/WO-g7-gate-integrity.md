# WO-g7 — Gate integrity: coverage floors and CI reach

status: open
assignee: builder
depends: none — this is repair, not new capability

## Objective

Make the gate suite incapable of the two ways it currently lies: passing without inspecting anything, and never running at all.

## In plain terms

Your automated checks can report success while checking nothing, and most of them never run automatically. Two were failing for days and nobody found out. This order fixes the checks that watch the checks.

## Findings — all measured 2026-08-05, not inferred

### F1 · The release door runs 9 of 46 gates

`bun qa/verify-release.ts` executes 11 stages. Two are `install` and `unit`; `unit` runs 13 named test files, not gates. So **9 gates** are covered: `windows-cold-boot`, `repo-shape`, `lockfile-committed`, `kernel-sole-writer`, `no-canvas-domain-writes`, `kernel-sole-writer-app`, `doc-links`, `rung-ladder`, `one-skin`.

**37 gates never run in CI**, including every gate proving Act I:

```
windows-dock-ontology      windows-dock-capability
windows-dock-hire          windows-dock-species
kernel-task-delegation     kernel-market-lineage
acp-fs-confine             windows-research-question
glacier-feel               hermes-founder-state
```

Each ran once, during its own rung, and never again. Nothing prevents a later change from breaking R1's gateway, R5's delegation, or R7's filesystem confinement.

**Timing, measured:**

| Gate | Runtime | Verdict |
|---|---|---|
| `glacier-feel` | 0.1s | cheap |
| `acp-fs-confine` | 0.1s | cheap |
| `schema-bundle-aliases` | 0.4s | cheap |
| `verb-retirement` | 0.5s | cheap |
| `kernel-task-delegation` | 0.6s | cheap |
| `kernel-market-lineage` | 0.8s | cheap |
| `observe-door` | 1.1s | cheap |
| `hermes-founder-state` | 12s | **needs WSL — must stay out of CI** |
| `windows-dock-*`, `windows-research-question` | 94–109s each | packaged-app gates |

Seven gates totalling **under four seconds** are excluded from a door that already spends minutes on a cold boot. There is no cost argument for that.

### F2 · A gate that inspects nothing reports PASS — proved

`verb-retirement` was run with its entire scan scope (`packages/qf-kernel/src/`, `collab-electron/src/main/`) repointed at directories that do not exist.

**Result: PASS.** It guarded nothing and reported success.

12 of 26 scanning gates carry no assertion that they read anything:

```
acp-fs-confine            artifact-root/run.ts
boot-reconcile/run.ts     bovada-football/run.ts
dock-profile-identity     dock-registry/run.ts
glacier-feel              kernel-one-path
kernel-sole-writer *      no-canvas-domain-writes *
product-identity          verb-retirement
```

`*` — fixed in `941fe94`; the other ten remain.

This is worse than a missing gate. A missing gate is visibly absent. A disarmed gate prints PASS.

### F3 · Two gates were red on `main` with nothing running them

Both found by this audit, both fixed in `4e4fd88`:

- **`kernel-one-path`** — all seven R1–R8 rung gates set `QF_KERNEL_DB` for the child they launch and none were allowlisted. The identical omission WO-WIN1/WIN2 made, repeated seven times.
- **`kernel-sole-writer`** — flagged `docs/orders/evidence/wo-g5a/0006-connection-actions.sql` for `INSERT INTO`. A saved migration excerpt kept as evidence. Red since 2026-08-04.

F3 is a direct consequence of F1: neither gate runs in CI, so neither failure surfaced.

### F4 · The build ships an architecture no gate has ever booted

`collab-electron/package.json` sets `"arch": ["x64", "arm64"]` for the Windows NSIS target. `windows-cold-boot` builds and launches `win-unpacked` — the x64 build. **`win-arm64-unpacked` is never started by anything.**

Origin: upstream Collaborator commit `f168d74` *"Add dual-architecture Mac builds (arm64 + x64)"* — correct for Mac, carried onto Windows without review. Cost: roughly half of every package run, for a 685 MB bundle plus a second installer.

The founder has stated this machine is Windows-x64 permanently.

## Deliverables

### D1 · Coverage floors on the remaining ten scanning gates

Every scanning gate must refuse to report PASS when its scan found nothing. Follow the pattern in `941fe94`: assert on the **outcome** (files actually read, and the presence of the specific tree the gate exists to protect), not on an optional path list. Emit a message naming what collapsed.

### D2 · Bring the cheap gates into the release door

Add to `qa/verify-release.ts`, its stage test, and `release-verifier`'s `EXPECTED_STAGES` — all three, in one commit, or `release-verifier` will fail:

```
glacier-feel · acp-fs-confine · schema-bundle-aliases · verb-retirement
kernel-task-delegation · kernel-market-lineage · observe-door
```

**Do not add `hermes-founder-state`.** It requires a WSL distro and fails closed without one; CI runs on `windows-latest`, which has none. Adding it turns the canonical door permanently red — this was attempted on 2026-08-04 and reverted in `86eac5f`. The same reasoning excludes the packaged-app gates from the default door.

### D3 · A second CI job for the packaged-app gates

The five `windows-dock-*` / `windows-research-question` gates cost ~100s each and prove R3–R8. They should run somewhere. Add a separate workflow job — nightly, or on pull request only — so Act I's proofs are exercised without adding eight minutes to every push.

If a gate genuinely cannot run in CI, say so **in the gate's own docstring**, with the reason. An unrunnable gate with no explanation is indistinguishable from a forgotten one.

### D4 · Drop the ARM64 Windows target

Set `"arch": ["x64"]` in `collab-electron/package.json`. Halves package time and stops shipping an untested binary.

**Founder decision required before landing this.** If ARM64 support is ever wanted, it needs a gate that boots it — otherwise it is a claim, not a capability.

## Contract

- No gate may be **removed** to make the suite green. Fix it or record why it cannot run.
- Every gate touched here keeps or gains a falsification path, and every one gets falsified in the report.
- No change to rung state, `NEXT.md`, doctrine, laws, or the schema.
- Do not widen an allowlist without first checking what the entry actually does. `species/claude-code/src/claude-code.mjs` was allowlisted in `4e4fd88` only after confirming it has no sqlite import and never opens the database — R1's "a seat never holds a database handle" was verified, not assumed.

## Acceptance gates

```bash
bun qa/run.ts --all
bun qa/verify-release.ts
```

`--all` must report every gate's verdict with no gate crashing — a crash produces no verdict and skips everything after it, which is how three gates hid on 2026-08-03.

For each gate given a coverage floor, paste a transcript showing it **red** when its scan is collapsed and **green** when restored. A floor that cannot be tripped is the same defect it was added to fix.

## Out of scope

- New product capability of any kind.
- Act I sign-off, R9, and anything on the rung ladder.
- Rewriting gates that already carry a floor.

## Report back

Per `PROTOCOL.md`, plus: the count of gates in the release door before and after, and the list of gates still excluded **with the reason for each**. That list is the deliverable that keeps this from happening again.
