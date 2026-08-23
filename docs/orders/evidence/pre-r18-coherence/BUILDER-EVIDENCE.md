# Pre-R18 Coherence — Round 2 Repair Builder Evidence

## Scope and candidate identity

This receipt records the repair after the Round 2 verifier failure at `b035d3fdfe7205747e1041e8d0303b01df653636`, with verifier evidence at `d0ae014ec79b6d33935f515b206de513ab1c20c7`. The repaired product candidate is `1a869c67f8d7c3f1bf6aec6247af2cd1ed3e87cf` on `wo-pre-r18-coherence`. R17 meaning, the R17 oracle, the R16 gate, all C01–C14 assertions and thresholds, and the R18 boundary were left unchanged; no R18 work was started.

## Blocker repairs

1. The opaque receipt failure was fixture/product handling, not a reason to weaken the contract. `renderTaskFoot` now retains the exact first existing `.qf-world-session-receipt` node by identity, retains the session-inspection surface, removes duplicate receipt/inspection nodes, and refreshes only their contents. Focused coverage appends duplicate receipt and inspection nodes, refreshes twice, and asserts exact receipt identity/content plus one inspection surface.

2. The fourteen screenshots were recaptured from the live production Electron BrowserWindow with the real `webContents.capturePage` path, using isolated disposable product/Kernal/artifact/runtime roots and real renderer lifecycle/mode/Inspect/cable interactions. Final captures are unique WebPs, exactly 1600x1000 at 100%, 37,576–80,890 bytes each, 1,009,496 bytes total, and visually inspected. Counts and hashes are in [SCREENSHOT-MANIFEST.md](./SCREENSHOT-MANIFEST.md). The capture bridge is proof-only (`QF_UI_PROOF=1`), and normal product behavior does not expose it.

3. Atlas generation is being performed only after this final product candidate, screenshot set, manifest, and builder receipt are fixed. The final Atlas check/ratchet/diff receipts and their separate evidence commit are recorded below after generation.

## Verification receipt

| Check | Result |
|---|---|
| `bun test src/windows/shell/src/task-composition.test.ts` | 3 pass, 0 fail, 62 expectations |
| `bun test src/windows/shell/src/research-world.test.ts` | 8 pass, 0 fail, 37 expectations |
| `bunx tsc --noEmit` | PASS |
| Live `bun qa/run.ts pre-r18-coherence` | PASS, run 1; C01–C14, oracle 16/20, inspected 16/20, cleanup clean |
| Live `bun qa/run.ts pre-r18-coherence` | PASS, run 2; C01–C14, oracle 16/20, inspected 16/20, cleanup clean |
| Capture-enabled live proof | PASS; 14/14 captures, unique hashes, 1600x1000, 1,009,496 bytes, roots removed |
| C01–C14 falsifiers | PASS as a red matrix: every named falsifier exited 1 with its expected `FALSIFY RED` marker |
| `bun qa/run.ts research-world-visible` | PASS; 13 oracle tiles / 15 cables, 10 pointer/inspect/collapse checks, roots clean |
| Required static/doc gates | PASS: repo-shape, lockfile-committed, kernel-sole-writer, no-canvas-domain-writes, kernel-sole-writer-app, doc-action-surface, one-skin, rung-ladder, doc-links |
| `bun install --frozen-lockfile` | PASS |

## Package-wide note

The authorized package-wide `bun test` completed `496 pass, 43 fail, 8 errors` across 539 tests. The failures are unrelated pre-existing/environmental package failures, including Hermes launcher/isolated-profile expectations, packaged-resource fixture setup, Windows `ls`/Electron test stubs, missing `pty-sidecar.js`/tmux runtime, Bun nested-describe behavior, and DOM/image-extension test environment mismatches. No unrelated package-wide failure was repaired.

## Atlas and handoff

Atlas was generated after the final product/evidence files were fixed. The final `generate --check`, ratchet, diff, `git diff --check`, clean-tree check, and pushed commit identities are appended here by the final handoff update.
