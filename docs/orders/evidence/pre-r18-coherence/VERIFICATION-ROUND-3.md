# Pre-R18 coherence independent verification — Round 3

verdict: **FAIL**
verifier-role: fresh independent verifier; no product or gate changes
product-candidate: `1a869c67f8d7c3f1bf6aec6247af2cd1ed3e87cf`
visual-evidence-commit: `d9864351f4a692d6d65eab57c2cb6032fd37232d`
atlas-commit: `55799f39b3e8b3ecb4f7692e2e0f6f03da13f69b`
origin-match-before: yes; worktree-before: clean

## Decisive red

All fourteen tracked WebPs were opened and inspected. File receipts are
mechanically green: every image is `1600x1000`, each is `<=600KB`, all fourteen
SHA-256 hashes are unique and match `SCREENSHOT-MANIFEST.md`, and total size is
`1,009,496` bytes. The semantic evidence is not green: `12-selected-artifact.webp`
and `13-selected-evaluation.webp` both visibly show the Critic participant
inspector and do not visibly show the required selected Artifact details or
selected Evaluation details. This violates the explicit frame-12/frame-13
acceptance condition. Frame 14 visibly shows a populated cable-dense world and
connection inspector; it does not repair the two missing named selections.

## Behavioral and falsifier receipts

- Changed-surface suite: `35 pass, 0 fail, 194 expect() calls`; the task-composition
  test retained the same opaque `.qf-world-session-receipt` node and the same
  `.qf-world-session-inspect` node across two refresh renders, removed duplicates,
  and preserved the unchanged no-receipt snapshot.
- Capture-disabled normal `bun qa/run.ts pre-r18-coherence`: PASS; literal oracle
  SHA `038a68c2508d3d671a60a1ab3d562d8d387e70ed08e582a4cca2e7fbf0519fa7`,
  `16` objects / `20` links, all `16` object and `20` link Inspect views,
  viewport `1600x1000`, scale `1`, Canvas `920x1000`, C01–C14 PASS,
  `roots_remaining=0 leaked=[]`.
- Every falsifier `C01` through `C14` exited `1` with its own named
  `FALSIFY RED C##` marker and expected condition.
- Inherited `research-world-visible`: PASS; `oracle_tiles=13 oracle_cables=15`,
  `pointer_tiles=10 inspect=10 collapse=10`, `roots_remaining=0 leaked=[]`.
- `bunx tsc --noEmit`: PASS. Static/doc gates all PASS:
  `repo-shape`, `lockfile-committed`, `kernel-sole-writer`,
  `no-canvas-domain-writes`, `kernel-sole-writer-app`, `doc-action-surface`,
  `one-skin`, `rung-ladder`, and `doc-links`.

## Bridge, authority, and boundary audit

The proof bridge is guarded in `collab-electron/src/main/index.ts`: `app.ui.evaluate`,
`app.ui.capturePage`, and `app.ui.pressKey` reject unless `QF_UI_PROOF=1`.
Capture uses the real `mainWindow.webContents.capturePage()` and writes only the
proof output; evaluation uses the real renderer `executeJavaScript`. The gate
launches the normal Electron preview with isolated app/Kernel/Artifact roots and
drives real renderer form submission, Mission reveal, Dock mode clicks, object
Inspect clicks, cable selection, and relaunch. No new ontology truth store or
product capability was found in the bridge. The normal run explicitly removed
capture/proof environment variables.

Atlas receipts: `generate.mjs --check` PASS (`439 files`, `126 channels`),
`ratchet.mjs` PASS (`HARD RED: 0`, unexplained coverage `0`), and
`generate.mjs --diff 4d25fa3...` PASS, `VERDICT: UNCHANGED`. Both
`git diff --check 4d25fa3...HEAD` and working-tree `git diff --check` passed.
The product, visual-evidence, and Atlas commits are separate consecutive
boundaries: `1a869c6` contains product/gate changes, `d986435` contains only
the fourteen images plus screenshot/builder evidence, and `55799f3` contains
only the Atlas projection refresh and builder receipt. Every working screenshot
blob equals its `d986435` blob.

The authorized package-wide suite was unrelated/environmental red:
`493 pass, 42 fail, 8 errors` across `535 tests` (`1,242` expectations), in
Hermes/profile and packaged-resource fixtures, Windows `ls`/Electron stubs,
native TUI/PTY/sidecar/tmux, Bun nested-describe, missing DOM globals, and image
extension environment tests. No package-wide failure was repaired.

Verifier-owned Electron processes and isolated roots were cleaned (`qf-pre-r18`
roots remaining `0`). Two pre-existing installed-app root processes remained at
`C:\Users\rybow\QuantFlow-L1-Acceptance\install\QuantFlow.exe` (PIDs `29620`
and `21212`, created before this verification); they were not spawned by this
verifier and were not terminated. Therefore the strict no-product-processes
end condition is not claimed.

The candidate remains FAIL. No implementation repair was made.
