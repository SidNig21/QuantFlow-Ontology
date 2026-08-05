# WO-g7 evidence — gate integrity

Plain language: the automated checks can no longer pretend they looked when they did not, and seven fast proofs that used to run once and then disappear now sit on the release door. The heavy packaged-app proofs run in their own CI workflow. Dropping the untested ARM64 Windows target is waiting on your say-so.

## Door count

| | Gates in `WINDOWS_RELEASE_STAGES` (excluding install/unit) |
|---|---|
| Before | 9 |
| After | 16 (+7 cheap) |

Before stage ids: `windows-cold-boot`, `repo-shape`, `lockfile-committed`, `kernel-sole-writer`, `no-canvas-domain-writes`, `kernel-sole-writer-app`, `doc-links`, `rung-ladder`, `one-skin`.

After adds: `glacier-feel`, `acp-fs-confine`, `schema-bundle-aliases`, `verb-retirement`, `kernel-task-delegation`, `kernel-market-lineage`, `observe-door`.

## D1 — coverage floors (remaining ten)

Floors added on: `verb-retirement`, `kernel-one-path`, `dock-registry`, `product-identity`, `dock-profile-identity` (callsite + INSERT walks), `artifact-root`, `glacier-feel`, `acp-fs-confine`, `boot-reconcile`, `bovada-football`.

Already floored before this order: `kernel-sole-writer`, `no-canvas-domain-writes`.

### Bait transcripts

**verb-retirement** — scoped prefixes pointed at nonexistent dirs:

```
verb-retirement: scan collapsed — 0 scoped files, kernel seen: false, main seen: false. Refusing to report PASS on a scan that inspected nothing.
FAIL  verb-retirement
…restore…
PASS  verb-retirement
```

**kernel-one-path** (G1 only) — walk root pointed at nonexistent path:

```
kernel-one-path: scan collapsed — 0 files, kernel package seen: false. Refusing to report PASS on a scan that inspected nothing.
{"ok":false,"offenders":["<scan-coverage-collapsed>"]}
…restore…
kernel-one-path G1: PASS (no illicit env reads or kernel.db literals)
{"ok":true,"offenders":[]}
```

**product-identity** — `trackedFiles()` forced empty:

```
product-identity: scan collapsed — 0 tracked files, collab-electron/package.json seen: false. Refusing to report PASS on a scan that inspected nothing.
FAIL  product-identity
```

(Restore still fails on a pre-existing residual in `design/glacier/showcase.html` — out of WO-g7 scope; floor itself tripped correctly.)

**glacier-feel** — protected source emptied:

```
glacier-feel FAIL:
  - glacier-feel: scan collapsed — a protected source file was empty. Refusing to report PASS on a scan that read nothing.
…restore…
PASS  glacier-feel
```

**dock-registry** — `WINDOWS` pointed at missing tree; floor requires `filesRead >= 10` (same shape as Law E). Restored tree currently reads ~94 files under `collab-electron/src/windows`.

## D2 — cheap gates on the door

Seven gates added to `qa/verify-release.ts`, `qa/gates/release-verifier.ts` `EXPECTED_STAGES`, and `qa/verify-release.test.ts` in lockstep.

Green run (2026-08-05 local):

```
PASS  glacier-feel
PASS  verb-retirement
PASS  acp-fs-confine
PASS  schema-bundle-aliases
PASS  observe-door
PASS  kernel-task-delegation
PASS  kernel-market-lineage
PASS  release-verifier
```

`bun test qa/verify-release.test.ts` — 4 pass.

## D3 — packaged-app CI

New workflow: `.github/workflows/packaged-app.yml` (separate file so `release-verifier`'s "exactly one run command in ci.yml" contract stays intact).

Runs on push to `main` and every PR:

- `windows-dock-collaboration`
- `windows-dock-ontology`
- `windows-dock-capability`
- `windows-dock-hire`
- `windows-dock-species`
- `windows-research-question`

Each gate's docstring now names this reach (or, for `hermes-founder-state`, why it cannot run in CI).

## D4 — ARM64 Windows target dropped

Founder authorized 2026-08-05. Windows NSIS `arch` is now `["x64"]` only in `collab-electron/package.json`. Mac dual-arch unchanged (upstream intent).

## Gates still excluded from the release door (with reason)

| Gate | Reason |
|---|---|
| `hermes-founder-state` | Needs WSL; CI `windows-latest` has none; fails closed without it (reverted from door in `86eac5f`) |
| `windows-dock-collaboration` | ~100s packaged-app; covered by `packaged-app.yml` |
| `windows-dock-ontology` | same |
| `windows-dock-capability` | same |
| `windows-dock-hire` | same |
| `windows-dock-species` | same |
| `windows-research-question` | same |
| Remaining non-door gates (e.g. `kernel-one-path`, `product-identity`, `artifact-root`, `dock-registry`, `bovada-football`, …) | Not in the WO-g7 seven; still runnable via `bun qa/run.ts <name>` / `--all`. Coverage floors added where they were scanning gates. |

## Judgment

- Put packaged-app proofs in a **second workflow file**, not a second job inside `ci.yml`, because `release-verifier` asserts the canonical workflow has exactly one `run:` command (`bun qa/verify-release.ts`). Widening that check would soften the door oracle; a sibling workflow preserves both contracts.
- Did not land D4 (ARM64 drop) without an explicit founder yes.
- Did not “fix” `product-identity`'s showcase residual — out of order scope; only proved the new floor goes red on empty scan.
